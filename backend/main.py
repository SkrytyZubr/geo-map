from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import time
import json
import os
import math
import shutil
import google.generativeai as genai
from dotenv import load_dotenv
from pymongo import MongoClient

# Inicjalizacja aplikacji
app = FastAPI(title="Skarby Pomorza API")
load_dotenv()

# --- KONFIGURACJA FOLDERU NA ZDJĘCIA ---
os.makedirs("static/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="static/uploads"), name="uploads")

# Konfiguracja Gemini
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    # Zmieniono na stabilny model flash, jeśli lite nie odpowiada
    ai_model = genai.GenerativeModel('gemini-2.5-flash-lite') 
else:
    ai_model = None
    print("Ostrzeżenie: Brak klucza GEMINI_API_KEY!")

# --- POŁĄCZENIE Z MONGODB ---
try:
    mongo_client = MongoClient("mongodb://localhost:27017/")
    db = mongo_client["skarby_pomorza"]
    collection = db["monuments"]
    print("Połączono z bazą MongoDB!")
except Exception as e:
    print(f"Błąd połączenia z bazą: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIStoryRequest(BaseModel):
    monument_name: str
    location: str

@app.get("/api/monuments")
def get_monuments():
    dane_z_bazy = list(collection.find({}))
    sformatowane_dane = []
    
    for doc in dane_z_bazy:
        lat, lng = 0, 0
        loc = doc.get("location")
        if isinstance(loc, dict) and "coordinates" in loc:
            lng = loc["coordinates"][0]
            lat = loc["coordinates"][1]
        else:
            lat = doc.get("lat") or 0
            lng = doc.get("lng") or 0

        if lat != 0 and lng != 0:
            sformatowane_dane.append({
                "id": str(doc.get("crfop_id") or doc.get("_id")),
                "name": doc.get("name") or "Pomnik",
                "type": doc.get("type") or "Obiekt",
                "desc": doc.get("desc") or "",
                # --- PRZYWRÓCONE DANE SZCZEGÓŁOWE ---
                "history": doc.get("history", ""),  
                "estimated_age": doc.get("estimated_age"),  
                "protection_year": doc.get("protection_year"),  
                "trees_details": doc.get("trees_details", []), # Tu jest obwód i wysokość
                # ------------------------------------
                "lat": float(lat),
                "lng": float(lng),
                "likes": doc.get("likes", 0),
                "image_url": doc.get("image_url") or "",
                "is_vandalized": doc.get("is_vandalized", False),
                "vandalism_details": doc.get("vandalism_details")
            })
            
    return sformatowane_dane

# --- NOWY ENDPOINT: ZGŁASZANIE WANDALIZMU (Aktualizacja obiektu) ---
@app.post("/api/vandalism")
async def report_vandalism(
    image: UploadFile = File(...),
    objectName: str = Form(...),
    dangerType: str = Form(...),
    description: str = Form(...)
):
    try:
        # 1. Zapis zdjęcia dowodowego
        image_bytes = await image.read()
        file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        file_name = f"VANDAL_{int(time.time())}.{file_ext}"
        file_path = f"static/uploads/{file_name}"
        
        with open(file_path, "wb") as buffer:
            buffer.write(image_bytes)
        image_url = f"http://localhost:5000/uploads/{file_name}"

        # 2. Aktualizacja atrybutów w istniejącym obiekcie w MongoDB
        result = collection.update_one(
            {"name": objectName},
            {"$set": {
                "is_vandalized": True,
                "vandalism_details": {
                    "type": dangerType,
                    "description": description,
                    "report_image": image_url,
                    "reported_at": time.time(),
                    "status": "Oczekuje na interwencję"
                }
            }}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Nie znaleziono obiektu o tej nazwie.")

        print(f"🚨 ZGŁOSZONO WANDALIZM: {objectName} ({dangerType})")
        return {"status": "success"}
    except Exception as e:
        print(f"❌ Błąd zgłoszenia wandalizmu: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się zaktualizować statusu obiektu.")

@app.post("/api/monuments/analyze")
async def analyze_image(image: UploadFile = File(...)):
    if not ai_model:
        raise HTTPException(status_code=500, detail="AI nie jest skonfigurowane.")
    try:
        image_bytes = await image.read()
        mime_type = image.content_type if image.content_type else "image/jpeg"
        
        prompt = """
        Jesteś ekspertem botaniki. Przeanalizuj zdjęcie.
        Zwróć TYLKO czysty JSON:
        {
            "species": "Nazwa gatunku", 
            "age": "Szacowany wiek", 
            "fact": "Krótka ciekawostka",
            "status": "ZDROWE lub CHORE",
            "disease_desc": "Opis jeśli chore"
        }
        """
        response = ai_model.generate_content(
            [prompt, {"mime_type": mime_type, "data": image_bytes}],
            generation_config={"response_mime_type": "application/json"}
        )
        return {"status": "success", "ai": json.loads(response.text.strip())}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd analizy obrazu.")

@app.post("/api/monuments/confirm")
async def confirm_monument(
    image: UploadFile = File(...),
    name: str = Form(...),
    type: str = Form(...),
    desc: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    status: str = Form("ZDROWE"),
    disease_desc: str = Form("")
):
    try:
        image_bytes = await image.read()
        mime_type = image.content_type if image.content_type else "image/jpeg"

        # Geofencing
        existing_monuments = list(collection.find({}))
        for doc in existing_monuments:
            loc = doc.get("location", {}).get("coordinates", [])
            if len(loc) == 2:
                db_lng, db_lat = loc[0], loc[1]
                distance = math.sqrt(((lat - db_lat) * 111139)**2 + ((lng - db_lng) * 111139)**2)
                if distance < 100:
                    # Opcjonalnie tutaj AI detektyw...
                    pass

        # Zapis pliku
        file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        new_id = f"USER_{int(time.time())}"
        file_name = f"{new_id}.{file_ext}"
        file_path = f"static/uploads/{file_name}"
        with open(file_path, "wb") as buffer:
            buffer.write(image_bytes)
        image_url = f"http://localhost:5000/uploads/{file_name}"

        new_monument = {
            "crfop_id": new_id,
            "name": name,
            "type": type,
            "desc": desc,
            "likes": 0,
            "location": {"type": "Point", "coordinates": [lng, lat]},
            "added_by_user": True,
            "image_url": image_url,
            "trees_details": [{"gatunek": name, "status": status, "disease_desc": disease_desc}] if type != "Głaz narzutowy" else []
        }
        collection.insert_one(new_monument)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/story")
def generate_story(req: AIStoryRequest):
    if not ai_model: raise HTTPException(status_code=500)
    try:
        prompt = f"Opowiedz legendę o: {req.monument_name} w {req.location}. Maks 3 zdania."
        return {"story": ai_model.generate_content(prompt).text.strip()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/monuments/{monument_id}/like")
async def like_monument(monument_id: str):
    # Próba dopasowania po crfop_id lub id
    result = collection.update_one(
        {"$or": [{"crfop_id": monument_id}, {"id": monument_id}]}, 
        {"$inc": {"likes": 1}}
    )
    return {"status": "success"}

@app.post("/api/doctortree")
async def doctor_tree(image: UploadFile = File(...)):
    if not ai_model:
        raise HTTPException(status_code=500, detail="AI nie jest skonfigurowane.")
    
    try:
        image_bytes = await image.read()
        mime_type = image.content_type if image.content_type else "image/jpeg"
        
        print(f"\n🩺 ODPALAM DOCTOR TREE...")
        print(f"Plik: {image.filename}, Typ: {mime_type}")

        prompt = """
        Jesteś wybitnym dendrologiem i patologiem roślin (DoctorTree). 
        Przeanalizuj to zdjęcie rośliny/drzewa/kory/liścia pod kątem chorób.

        Zwróć TYLKO I WYŁĄCZNIE czysty JSON. Żadnego wstępu, żadnego formatowania markdown (```json).
        Schemat:
        {
            "status": "CHORE",
            "problem": "Opis widocznych objawów (np. żółknące liście, pleśń)",
            "cause": "Prawdopodobna przyczyna (np. mszyce, brak wody, grzyb)",
            "treatment": "Jak to leczyć lub uratować roślinę"
        }
        Jeśli roślina na zdjęciu wygląda na 100% zdrową, zwróć:
        {
            "status": "ZDROWE",
            "problem": "Brak widocznych objawów",
            "cause": "Brak",
            "treatment": "Nie wymaga interwencji, roślina jest w świetnym stanie"
        }
        """

        # Używamy wymuszenia formatu JSON na poziomie API
        response = ai_model.generate_content(
            [prompt, {"mime_type": mime_type, "data": image_bytes}],
            generation_config={"response_mime_type": "application/json"}
        )

        # Pobieramy tekst z API
        raw_text = response.text.strip()
        print(f"🤖 Odpowiedź od LLM: {raw_text}") # TO CI URATUJE ŻYCIE JAK COŚ PÓJDZIE NIE TAK

        # Brutalne czyszczenie ze znaczników markdown (jeśli AI zignoruje zasady)
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        raw_text = raw_text.strip()

        # Parsowanie do obiektu Pythonowego
        diagnosis_data = json.loads(raw_text)

        print("✅ Diagnoza udana!")
        return {"status": "success", "diagnosis": diagnosis_data}

    except json.JSONDecodeError as je:
        print(f"❌ BŁĄD PARSOWANIA JSON: {je}")
        print(f"Tekst, którego nie udało się sparsować: {raw_text}")
        return {
            "status": "success", # Zwracamy success żeby frontend nie wywalił błędu
            "diagnosis": {
                "status": "BŁĄD",
                "problem": "AI zwróciło nieczytelny format diagnozy.",
                "cause": "Błąd komunikacji z modelem LLM.",
                "treatment": "Spróbuj wysłać zgłoszenie ponownie."
            }
        }
    except Exception as e:
        print(f"❌ KRYTYCZNY BŁĄD DOCTOR TREE: {str(e)}")
        # Awaryjna odpowiedź, która uratuje UX aplikacji we Frontendzie
        return {
            "status": "success", 
            "diagnosis": {
                "status": "NIEROZPOZNANO",
                "problem": "Nie udało się przeanalizować obrazu.",
                "cause": f"System AI napotkał problem: {str(e)}",
                "treatment": "Zrób inne, wyraźniejsze zdjęcie przy dobrym oświetleniu."
            }
        }
