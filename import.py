import pandas as pd
import geopandas as gpd
from pymongo import MongoClient

# --- KONFIGURACJA PLIKÓW ---
EXCEL_FILE = "260308013036fopExport.xls" # Zmień na .xls, jeśli taki masz z systemu
ARKUSZ_POMNIKI = "pomnik_przyrody"
ARKUSZ_TWORY = "twor_przyrody"

# ---------------------------------------------------------
# 1. ETAP PRZESTRZENNY: Wyciągamy GPS z plików Shapefile
# ---------------------------------------------------------
print("🌍 1/4: Ładowanie plików przestrzennych (Shapefile)...")

gdf_points = gpd.read_file("PomnikiPrzyrodyPoint.shp")
gdf_mpoints = gpd.read_file("PomnikiPrzyrodyMPoint.shp")

gdf_all = pd.concat([gdf_points, gdf_mpoints], ignore_index=True)

print("🌍 Przeliczanie współrzędnych na format GPS...")
gdf_all = gdf_all.to_crs(epsg=4326)

lokalizacje_dict = {}

id_col_shp = None
for col in ["fop_id", "FOP_ID", "id", "ID"]:
    if col in gdf_all.columns:
        id_col_shp = col
        break

if not id_col_shp:
    print(f"BŁĄD: Nie znaleziono kolumny ID w pliku SHP! Dostępne kolumny to: {gdf_all.columns.tolist()}")
    exit()

for index, row in gdf_all.iterrows():
    ob_id = row[id_col_shp]
    geom = row.geometry
    
    if pd.notna(ob_id) and geom and not geom.is_empty:
        centroid = geom.centroid
        lokalizacje_dict[ob_id] = [centroid.x, centroid.y]

print(f"✅ Wyciągnięto lokalizacje GPS dla {len(lokalizacje_dict)} pomników przyrody!")


# ---------------------------------------------------------
# 2. ETAP SZCZEGÓŁÓW: Wymiary poszczególnych drzew z arkusza "twor_przyrody"
# ---------------------------------------------------------
print(f"\n🌳 2/4: Ładowanie wymiarów drzew (arkusz: {ARKUSZ_TWORY})...")
try:
    # CZYTAMY KONKRETNY ARKUSZ Z JEDNEGO PLIKU
    df_twory = pd.read_excel(EXCEL_FILE, sheet_name=ARKUSZ_TWORY).fillna("")
    
    KLUCZ_W_TWORACH = "fop_id" 
    
    drzewa_dict = {}
    for index, row in df_twory.iterrows():
        id_pomnika = row.get(KLUCZ_W_TWORACH)
        if not id_pomnika:
            continue
            
        if id_pomnika not in drzewa_dict:
            drzewa_dict[id_pomnika] = []
            
        drzewo = {
            "gatunek": row.get("gatunek_drzewa", "Nieznany").strip() if isinstance(row.get("gatunek_drzewa"), str) else "Nieznany",
            "obwod_cm": row.get("obwod", ""),
            "wysokosc_m": row.get("wysokosc", "")
        }
        drzewa_dict[id_pomnika].append(drzewo)
    print(f"✅ Zgrupowano parametry drzew dla {len(drzewa_dict)} pomników!")
except Exception as e:
    print(f"Błąd czytania szczegółów drzew: {e}.")
    drzewa_dict = {}


# ---------------------------------------------------------
# 3. ETAP GŁÓWNY: Baza pomników z arkusza "pomnik_przyrody"
# ---------------------------------------------------------
print(f"\n📝 3/4: Budowanie ostatecznych dokumentów (arkusz: {ARKUSZ_POMNIKI})...")
try:
    # CZYTAMY GŁÓWNY ARKUSZ Z TEGO SAMEGO PLIKU
    df_pomniki = pd.read_excel(EXCEL_FILE, sheet_name=ARKUSZ_POMNIKI).fillna("")
    KLUCZ_W_POMNIKACH = "fop_id"
    
    documents_to_insert = []
    
    for index, row in df_pomniki.iterrows():
        id_pomnika = row.get(KLUCZ_W_POMNIKACH)
        
        if id_pomnika not in lokalizacje_dict:
            continue
            
        lista_drzew = drzewa_dict.get(id_pomnika, [])
        coords = lokalizacje_dict[id_pomnika]
        
        nazwa = str(row.get("nazwa", "")).strip()
        typ_tworu = str(row.get("podtyp_tworu", row.get("typ_tworu", "Pomnik przyrody"))).strip()
        
        # Jeśli nazwa to np. "brak danych" albo jest pusta, używamy typu tworu (np. "Grupa drzew")
        if not nazwa or nazwa.lower() == "brak danych":
            nazwa = typ_tworu
            
        document = {
            "crfop_id": int(id_pomnika) if isinstance(id_pomnika, (int, float)) else id_pomnika,
            "name": nazwa,
            "type": typ_tworu,
            "desc": str(row.get("opis_lokalizacji", "Brak dokładnego opisu lokalizacji.")).strip(),
            "location": {
                "type": "Point",
                "coordinates": coords
            },
            "trees_details": lista_drzew,
            "source": "CRFOP",
            "added_by_user": False
        }
        documents_to_insert.append(document)
    print(f"✅ Przygotowano {len(documents_to_insert)} gotowych dokumentów do bazy MongoDB!")
except Exception as e:
    print(f"Błąd przetwarzania głównych pomników: {e}")
    documents_to_insert = []


# ---------------------------------------------------------
# 4. ETAP BAZY DANYCH: Wstrzyknięcie do MongoDB
# ---------------------------------------------------------
print("\n🚀 4/4: Eksport do bazy danych MongoDB...")
if documents_to_insert:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["skarby_pomorza"]
    collection = db["monuments"]
    
    collection.delete_many({})
    collection.insert_many(documents_to_insert)
    collection.create_index([("location", "2dsphere")]) 
    
    print(f"🎉 PEŁEN SUKCES! Aplikacja jest gotowa do czytania danych z MongoDB.")
else:
    print("❌ Nie dodano żadnych obiektów. Sprawdź logi błędów powyżej.")