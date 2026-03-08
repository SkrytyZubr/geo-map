from pymongo import MongoClient
import time

client = MongoClient("mongodb://localhost:27017/")
db = client["skarby_pomorza"]
collection = db["monuments"]

print("Czyszczenie starej bazy danych...")
collection.delete_many({})

pomniki = [
    {
        "crfop_id": "POM_001",
        "name": "Gruby Dąb w Oliwie",
        "type": "Pojedyncze drzewo",
        "desc": "Najgrubszy dąb w Trójmieście. Prawdziwy strażnik Doliny Radości w Gdańsku.",
        "history": "Według lokalnych zapisków dąb ten został posadzony prawdopodobnie przez mnichów z zakonu Cystersów, którzy od XII wieku gospodarowali w Oliwie. Przetrwał potop szwedzki i oblężenia Gdańska.",
        "estimated_age": 400,
        "protection_year": 1956,
        "eco_impact": "Jego rozłożysta korona o powierzchni ponad 400 m² daje schronienie dziesiątkom gatunków ptaków i owadów zapylających.",
        "likes": 42,
        "location": {"type": "Point", "coordinates": [18.5440, 54.4080]},
        "image_url": "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
        "added_by_user": False,
        "trees_details": [{"gatunek": "Dąb szypułkowy", "obwod_cm": 520, "wysokosc_m": 25, "status": "ZDROWE", "disease_desc": ""}]
    },
    {
        "crfop_id": "POM_002",
        "name": "Dąb Wybickiego",
        "type": "Pojedyncze drzewo",
        "desc": "Rośnie w Będominie, tuż obok Muzeum Hymnu Narodowego. Niestety, wiek robi swoje.",
        "history": "Drzewo rośnie na terenie dawnego majątku rodziny Wybickich. Romantyczne legendy głoszą, że to w jego cieniu Józef Wybicki szukał natchnienia w młodzieńczych latach, zanim napisał Mazurka Dąbrowskiego.",
        "estimated_age": 450,
        "protection_year": 1955,
        "eco_impact": "Jako sędziwy weteran jest bezcennym siedliskiem dla rzadkich chrząszczy saproksylicznych, żyjących w martwym drewnie.",
        "likes": 89,
        "location": {"type": "Point", "coordinates": [18.0644, 54.1566]},
        "image_url": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86",
        "added_by_user": False,
        "trees_details": [{"gatunek": "Dąb szypułkowy", "obwod_cm": 630, "wysokosc_m": 22, "status": "CHORE", "disease_desc": "Rozległa próchnica pnia i zaatakowanie przez żółciaka siarkowego. Wymaga podpór."}]
    },
    {
        "crfop_id": "POM_003",
        "name": "Aleja Lipowa w Rzucewie",
        "type": "Aleja",
        "desc": "Zabytkowa, czterorzędowa aleja lipowa prowadząca do rzucewskiego pałacu.",
        "history": "Lokalne podania, powtarzane z pokolenia na pokolenie, przypisują posadzenie tej alei samemu królowi Janowi III Sobieskiemu, który często bywał w tutejszych dobrach wraz z Marysieńką.",
        "estimated_age": 350,
        "protection_year": 1978,
        "eco_impact": "Podczas letniego kwitnienia aleja zamienia się w gigantyczną, pachnącą stołówkę dla tysięcy pszczół miodnych i trzmieli.",
        "likes": 156,
        "location": {"type": "Point", "coordinates": [18.4682, 54.6865]},
        "image_url": "https://images.unsplash.com/photo-1502082553048-f009c37129b9",
        "added_by_user": False,
        "trees_details": [
            {"gatunek": "Lipa drobnolistna", "obwod_cm": 310, "wysokosc_m": 18, "status": "ZDROWE", "disease_desc": ""},
            {"gatunek": "Lipa drobnolistna", "obwod_cm": 280, "wysokosc_m": 17, "status": "CHORE", "disease_desc": "Zakażenie jemiołą, osłabienie korony."},
            {"gatunek": "Lipa drobnolistna", "obwod_cm": 340, "wysokosc_m": 19, "status": "ZDROWE", "disease_desc": ""}
        ]
    },
    {
        "crfop_id": "POM_004",
        "name": "Diabelski Kamień w Odargowie",
        "type": "Głaz narzutowy",
        "desc": "Gigantyczny eratyk z epoki lodowcowej, spoczywający w lesie pod Odargowem.",
        "history": "Przywleczony ze Skandynawii kilkanaście tysięcy lat temu przez lądolód. Kaszubskie mity głoszą, że diabeł niósł go, by zniszczyć nowo wybudowany kościół w Żarnowcu, ale upuścił go, słysząc poranne bicie dzwonów.",
        "estimated_age": 12000,
        "protection_year": 1954,
        "eco_impact": "Zacieniona powierzchnia głazu stanowi chłodny mikrokosmos, w którym rosną rzadkie gatunki naskalnych porostów i mchów.",
        "likes": 210,
        "location": {"type": "Point", "coordinates": [18.0500, 54.7700]},
        "image_url": "https://images.unsplash.com/photo-1469142587002-998813fc0eb4",
        "added_by_user": False,
        "trees_details": [] 
    },
    {
        "crfop_id": "POM_005",
        "name": "Sosna Wydmowa w Sopocie",
        "type": "Pojedyncze drzewo",
        "desc": "Stara sosna opierająca się sztormowym wiatrom wiejącym od Zatoki Gdańskiej.",
        "history": "Świadek przekształcania się Sopotu z małej wioski rybackiej w luksusowy nadmorski kurort. Drzewo to uwieczniano na starych niemieckich pocztówkach z przełomu XIX i XX wieku.",
        "estimated_age": 160,
        "protection_year": 1980,
        "eco_impact": "Jej potężny, powierzchniowy system korzeniowy działa jak naturalna siatka, zapobiegając erozji nadmorskiej wydmy.",
        "likes": 34,
        "location": {"type": "Point", "coordinates": [18.5600, 54.4400]},
        "image_url": "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0",
        "added_by_user": False,
        "trees_details": [{"gatunek": "Sosna zwyczajna", "obwod_cm": 180, "wysokosc_m": 12, "status": "CHORE", "disease_desc": "Opadzina igieł i inwazja mszycy sosnowej. Potrzebny oprysk interwencyjny."}]
    },
    {
        "crfop_id": "POM_006",
        "name": "Trzy Cisy w Gdyni",
        "type": "Grupa drzew",
        "desc": "Wiekowo szacowane na kilkaset lat cisy w rezerwacie Kępa Redłowska.",
        "history": "To żywy dowód dawnej świetności naturalnych lasów cisowych na Pomorzu. Warto pamiętać, że cisy chroniono w Polsce już od 1423 roku na mocy edyktu króla Władysława Jagiełły!",
        "estimated_age": 300,
        "protection_year": 1938,
        "eco_impact": "Czerwone osnówki nasion cisa to kluczowy, kaloryczny pokarm dla ptaków zimujących w Polsce, takich jak jemiołuszki czy drozdy.",
        "likes": 77,
        "location": {"type": "Point", "coordinates": [18.5550, 54.4900]},
        "image_url": "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d",
        "added_by_user": False,
        "trees_details": [
            {"gatunek": "Cis pospolity", "obwod_cm": 120, "wysokosc_m": 8, "status": "ZDROWE", "disease_desc": ""},
            {"gatunek": "Cis pospolity", "obwod_cm": 115, "wysokosc_m": 7, "status": "ZDROWE", "disease_desc": ""},
            {"gatunek": "Cis pospolity", "obwod_cm": 130, "wysokosc_m": 8, "status": "ZDROWE", "disease_desc": ""}
        ]
    },
    {
        "crfop_id": "POM_007",
        "name": "Platany w Parku Wejherowskim",
        "type": "Grupa drzew",
        "desc": "Majestatyczne platany klonolistne o charakterystycznej, łuszczącej się korze.",
        "history": "Posadzone najprawdopodobniej w XIX wieku przez dawnych właścicieli dóbr wejherowskich, hrabiów von Keyserlingk, którzy z wielką pasją sprowadzali rzadkie okazy botaniczne z całej Europy.",
        "estimated_age": 200,
        "protection_year": 1970,
        "eco_impact": "Liście platanów pokryte są delikatnym kutnerem, który rewelacyjnie wyłapuje i filtruje pyły zawieszone (smog) z miejskiego powietrza.",
        "likes": 112,
        "location": {"type": "Point", "coordinates": [18.2300, 54.6000]},
        "image_url": "https://images.unsplash.com/photo-1462143338528-eca9936a4d09",
        "added_by_user": False,
        "trees_details": [
            {"gatunek": "Platan klonolistny", "obwod_cm": 410, "wysokosc_m": 28, "status": "ZDROWE", "disease_desc": ""},
            {"gatunek": "Platan klonolistny", "obwod_cm": 395, "wysokosc_m": 27, "status": "CHORE", "disease_desc": "Plamistość liści platana (gnomonioza). Zalecone zgrabianie i utylizacja opadłych liści."}
        ]
    },
    {
        "crfop_id": "POM_008",
        "name": "Buk Upiór w Gdańsku",
        "type": "Pojedyncze drzewo",
        "desc": "Potężny buk o poskręcanych gałęziach. Wygląda upiornie, ale jest w 100% zdrowy!",
        "history": "Mroczną nazwę zyskał dzięki swoim groteskowo powyginanym, nagim konarom. Wśród mieszkańców gdańskich dzielnic krążą miejskie legendy, jakoby drzewo ożywało podczas letniego przesilenia.",
        "estimated_age": 220,
        "protection_year": 1990,
        "eco_impact": "Jego pożywne nasiona, zwane bukwią, stanowią kluczowe pożywienie pozwalające dzikom, wiewiórkom i ptakom zgromadzić tłuszcz przed nadejściem zimy.",
        "likes": 205,
        "location": {"type": "Point", "coordinates": [18.5300, 54.3800]},
        "image_url": "https://images.unsplash.com/photo-1458966480358-a0ac42de0a7a",
        "added_by_user": False,
        "trees_details": [{"gatunek": "Buk zwyczajny", "obwod_cm": 450, "wysokosc_m": 30, "status": "ZDROWE", "disease_desc": ""}]
    },
    {
        "crfop_id": "POM_009",
        "name": "Krzywy Las koło Chojnic",
        "type": "Grupa drzew",
        "desc": "Zjawiskowa grupa sosen o nienaturalnie wygiętych w łuk pniach.",
        "history": "Posadzone na początku lat 30. XX wieku. Mimo wielu badań, ich tajemnicze wygięcie do dziś nie zostało w pełni wyjaśnione. Najpopularniejsza hipoteza zakłada celowe mechaniczne uszkodzenie młodych drzewek przez lokalnych stolarzy w celu uzyskania krzywego drewna na beczki lub meble.",
        "estimated_age": 90,
        "protection_year": 2006,
        "eco_impact": "Ze względu na swoją anomalię, drzewa te są bezcennym poligonem badawczym dla dendrologów z całego świata badających procesy gojenia się i geotropizmu roślin.",
        "likes": 400,
        "location": {"type": "Point", "coordinates": [17.5500, 53.7000]},
        "image_url": "https://images.unsplash.com/photo-1448375240586-882707db888b",
        "added_by_user": False,
        "trees_details": [
            {"gatunek": "Sosna zwyczajna", "obwod_cm": 90, "wysokosc_m": 15, "status": "ZDROWE", "disease_desc": ""},
            {"gatunek": "Sosna zwyczajna", "obwod_cm": 85, "wysokosc_m": 14, "status": "ZDROWE", "disease_desc": ""}
        ]
    },
    {
        "crfop_id": "POM_010",
        "name": "Wiąz Szypułkowy z Tczewa",
        "type": "Pojedyncze drzewo",
        "desc": "Prawdziwy wojownik, ocalały z masowej epidemii holenderskiej choroby wiązów.",
        "history": "Rośnie tu od czasów budowy słynnych, zabytkowych mostów tczewskich na Wiśle w XIX wieku. Jest jednym z nielicznych tak starych wiązów, który przetrwał wielką zarazę dziesiątkującą ten gatunek w Europie.",
        "estimated_age": 180,
        "protection_year": 1985,
        "eco_impact": "Każdy dojrzały, stary wiąz to żywy, unikalny bank genów odpornościowych, absolutnie kluczowy dla przetrwania tego gatunku na kontynencie.",
        "likes": 12,
        "location": {"type": "Point", "coordinates": [18.7900, 54.0900]},
        "image_url": "https://images.unsplash.com/photo-1503788311183-ce3f92b77a28",
        "added_by_user": False,
        "trees_details": [{"gatunek": "Wiąz szypułkowy", "obwod_cm": 290, "wysokosc_m": 21, "status": "CHORE", "disease_desc": "Grafioza wiązu (holenderska choroba wiązów). Szybko postępujące więdnięcie liści."}]
    }
]

# DODAJEMY INFO O WANDALIZMIE DO KAŻDEGO OBIEKTU PRZED INSERTEM
for p in pomniki:
    p["is_vandalized"] = False
    p["vandalism_details"] = None

collection.insert_many(pomniki)
print(f"BUM! Dodano {len(pomniki)} pięknych obiektów do bazy danych z historią, statystykami i gotowym miejscem na zgłoszenia!")