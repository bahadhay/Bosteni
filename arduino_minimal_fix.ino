#include "DHT.h"
#include <ESP32Servo.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>

// ------------------ WIFI ------------------
#define WIFI_SSID "iPhone Aziz"
#define WIFI_PASSWORD "zaghouan3"

#define API_KEY "AIzaSyB2wihmG2yCv6WtXUDjpAjPTyqC_D0cEE0"
#define DATABASE_URL "https://tpiot-de1ee-default-rtdb.europe-west1.firebasedatabase.app/"
#define USER_EMAIL "dorra@gmail.com"
#define USER_PASSWORD "123456"

// ------------------ FIREBASE ------------------
FirebaseData fbdo;
FirebaseData fbdoStream;
FirebaseAuth auth;
FirebaseConfig config;

#define DHTPIN 4
#define DHTTYPE DHT22

#define SOIL_PIN 34
#define RAIN_PIN 27
#define TRIG_PIN 12
#define ECHO_PIN 14
#define SERVO_PIN 15

// pin de pompe
#define P_IN1 25
#define P_IN2 26
bool pompeState = false;

#define MAISON_ID "maison_1"

DHT dht(DHTPIN, DHTTYPE);
Servo servo;

// hauteur totale de la citerne (en cm)
const float TANK_HEIGHT = 8.5;

// positions servo
const int SERVO_CLOSE = 90;  // bâche fermée
const int SERVO_OPEN = 0;    // bâche ouverte
const int solpar = 40;
const int solmax = 50;
const int solmin = 30;
const int tempmax = 32;
const int tempmin = 10;

int servoAngle = SERVO_CLOSE;

// VARIABLES MODE CONTROLE
String currentMode = "automatique";  // "automatique" ou "manuel"
String commandeBache = "fermer";     // "ouvrir" ou "fermer"
String commandePompe = "OFF";        // "ON" ou "OFF"

// 🔥 CHANGEMENT 1: Variable pour forcer mise à jour immédiate
bool forceUpdate = false;

// 🔥 AJOUT: Variables pour suivre la dernière commande appliquée
String lastAppliedBacheCommand = "fermer";
String lastAppliedPompeCommand = "OFF";

// ------------------ CALLBACK FIREBASE STREAM ------------------
void streamCallback(StreamData data) {
  String path = data.dataPath();

  Serial.println("📡 Donnée reçue de Firebase:");
  Serial.println("Path: " + path);

  // 🔥 FIX: Lire selon le type de path
  if (path == "/") {
    // Quand on reçoit tout l'objet, lire via JSON
    FirebaseJson *json = data.jsonObjectPtr();
    FirebaseJsonData result;

    if (json->get(result, "mode")) {
      currentMode = result.stringValue;
      Serial.println("✅ Mode: " + currentMode);
    }

    if (json->get(result, "commandes/bache")) {
      String newBacheCmd = result.stringValue;
      if (newBacheCmd != commandeBache) {
        commandeBache = newBacheCmd;
        Serial.println("🔧 Commande bâche: " + commandeBache);
        forceUpdate = true;
      }
    }

    if (json->get(result, "commandes/pompe")) {
      String newPompeCmd = result.stringValue;
      if (newPompeCmd != commandePompe) {
        commandePompe = newPompeCmd;
        Serial.println("💧 Commande pompe: " + commandePompe);
        forceUpdate = true;
      }
    }
  } else {
    // Chemins spécifiques
    if (path == "/mode") {
      if (data.dataType() == "string") {
        currentMode = data.stringData();
        Serial.println("✅ Mode changé: " + currentMode);
      }
    }

    if (path == "/commandes/bache") {
      if (data.dataType() == "string") {
        commandeBache = data.stringData();
        Serial.println("🔧 Commande bâche: " + commandeBache);
        forceUpdate = true;
      }
    }

    if (path == "/commandes/pompe") {
      if (data.dataType() == "string") {
        commandePompe = data.stringData();
        Serial.println("💧 Commande pompe: " + commandePompe);
        forceUpdate = true;
      }
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("⚠️ Stream timeout, reconnexion...");
  }
}

// ------------------ SETUP ------------------
void setup() {
  Serial.begin(115200);

  // WIFI
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connexion WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println(" connecté !");

  // FIREBASE CONFIG
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Attendre que Firebase soit prêt
  Serial.println("⏳ Attente Firebase...");
  while (!Firebase.ready()) {
    delay(100);
  }
  Serial.println("✅ Firebase prêt !");

  // INITIALISER LE MODE PAR DÉFAUT DANS FIREBASE
  String basePath = "/maisons/" + String(MAISON_ID);
  Firebase.setString(fbdo, basePath + "/mode", "automatique");
  Firebase.setString(fbdo, basePath + "/commandes/bache", "fermer");
  Firebase.setString(fbdo, basePath + "/commandes/pompe", "OFF");

  // DÉMARRER LE STREAM FIREBASE
  if (!Firebase.beginStream(fbdoStream, basePath)) {
    Serial.println("❌ Erreur stream: " + fbdoStream.errorReason());
  } else {
    Serial.println("✅ Stream Firebase démarré !");
    Firebase.setStreamCallback(fbdoStream, streamCallback, streamTimeoutCallback);
  }

  // INIT CAPTEURS
  dht.begin();
  pinMode(RAIN_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(P_IN1, OUTPUT);
  pinMode(P_IN2, OUTPUT);

  servo.attach(SERVO_PIN);
  servo.write(SERVO_CLOSE);
}

// ------------------ LECTURE ULTRASON ------------------
float getDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;
  return distance;
}

// ------------------ CONTROLE AUTOMATIQUE BACHE ------------------
void controlBacheAuto(float temp, int soil, bool rain) {
  servoAngle = SERVO_CLOSE;

  if (temp > tempmax) {
    servoAngle = SERVO_OPEN;
    Serial.println(">>> BACHE = OUVERTE (Température haute)");
  } else if (temp < tempmin) {
    servoAngle = SERVO_OPEN;
    Serial.println(">>> BACHE = OUVERTE (Température basse)");
  } else if (rain && soil > solpar) {
    servoAngle = SERVO_OPEN;
    Serial.println(">>> BACHE = OUVERTE (Pluie + sol humide)");
  } else if (soil > solpar && (temp > tempmax || temp < tempmin)) {
    servoAngle = SERVO_OPEN;
    Serial.println(">>> BACHE = OUVERTE (Sol humide + température extrême)");
  } else {
    servoAngle = SERVO_CLOSE;
    Serial.println(">>> BACHE = FERMÉE");
  }

  servo.write(servoAngle);
}

// ------------------ CONTROLE MANUEL BACHE ------------------
void controlBacheManuel() {
  // 🔥 FIX: N'appliquer que si la commande a changé
  if (commandeBache != lastAppliedBacheCommand) {
    if (commandeBache == "ouvrir") {
      servoAngle = SERVO_OPEN;
      Serial.println(">>> BACHE = OUVERTE (Commande manuelle)");
    } else {
      servoAngle = SERVO_CLOSE;
      Serial.println(">>> BACHE = FERMÉE (Commande manuelle)");
    }
    servo.write(servoAngle);
    lastAppliedBacheCommand = commandeBache;  // Mémoriser
  }
}

// ------------------ CONTROLE AUTOMATIQUE POMPE ------------------
void controlPompeAuto(int soil) {
  if (soil < solmin) {
    digitalWrite(P_IN1, HIGH);
    digitalWrite(P_IN2, LOW);
    pompeState = true;
    Serial.println(">>> POMPE = ON (Auto: sol sec)");
  } else if (soil >= solmax) {
    digitalWrite(P_IN1, LOW);
    digitalWrite(P_IN2, LOW);
    pompeState = false;
    Serial.println(">>> POMPE = OFF (Auto: sol humide)");
  }
}

// ------------------ CONTROLE MANUEL POMPE ------------------
void controlPompeManuel() {
  // 🔥 FIX: N'appliquer que si la commande a changé
  if (commandePompe != lastAppliedPompeCommand) {
    if (commandePompe == "ON") {
      digitalWrite(P_IN1, HIGH);
      digitalWrite(P_IN2, LOW);
      pompeState = true;
      Serial.println(">>> POMPE = ON (Commande manuelle)");
    } else {
      digitalWrite(P_IN1, LOW);
      digitalWrite(P_IN2, LOW);
      pompeState = false;
      Serial.println(">>> POMPE = OFF (Commande manuelle)");
    }
    lastAppliedPompeCommand = commandePompe;  // Mémoriser
  }
}

// ------------------ LOOP ------------------
void loop() {
  // Lecture capteurs
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int soilValue = analogRead(SOIL_PIN);
  int soilPercent = map(soilValue, 4095, 0, 0, 100);
  int rainState = digitalRead(RAIN_PIN);
  bool pluie = (rainState == 0);

  // Niveau d'eau
  float distance = getDistanceCM();
  if (distance < 1 || distance > TANK_HEIGHT)
    distance = -1;

  float filledPercent = 0;
  if (distance != -1) {
    float waterHeight = TANK_HEIGHT - distance;
    filledPercent = (waterHeight / TANK_HEIGHT) * 100.0;
    filledPercent = constrain(filledPercent, 0, 100);
  }

  // ========== LOGIQUE DE CONTROLE ==========
  Serial.println("===== MODE: " + currentMode + " =====");

  if (currentMode == "automatique") {
    // MODE AUTOMATIQUE
    controlBacheAuto(temperature, soilPercent, pluie);
    controlPompeAuto(soilPercent);
  } else {
    // MODE MANUEL
    controlBacheManuel();
    controlPompeManuel();
  }

  // Affichage
  Serial.println("===== MESURES =====");
  Serial.print("Humidité air : ");
  Serial.println(humidity);
  Serial.print("Température : ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("Humidité sol : ");
  Serial.print(soilPercent);
  Serial.println(" %");
  Serial.print("Pluie : ");
  Serial.println(pluie ? "pluie tombe" : "pas de pluie");

  if (distance == -1)
    Serial.println("Niveau eau : erreur de mesure");
  else
    Serial.printf("Niveau eau : %.1f %%\n", filledPercent);

  Serial.print("État bâche : ");
  Serial.print(servoAngle == SERVO_CLOSE ? "FERMÉE" : "OUVERTE");
  Serial.print(" (Angle : ");
  Serial.print(servoAngle);
  Serial.println("°)");

  Serial.println("----- ETAT POMPE -----");
  if (pompeState) {
    Serial.println("Pompe : ON (arrosage en cours)");
  } else {
    Serial.println("Pompe : OFF (arrosage arrêté)");
  }
  Serial.println("====================\n");

  // ========== ENVOI VERS FIREBASE ==========
  if (Firebase.ready()) {
    String basePath = "/maisons/" + String(MAISON_ID) + "/";

    Firebase.setFloat(fbdo, basePath + "humiditeAir", humidity);
    Firebase.setFloat(fbdo, basePath + "temperature", temperature);
    Firebase.setInt(fbdo, basePath + "humiditeSol", soilPercent);
    Firebase.setString(fbdo, basePath + "pluie", pluie ? "pluie" : "pas de pluie");
    Firebase.setFloat(fbdo, basePath + "niveauEau", filledPercent);
    Firebase.setString(fbdo, basePath + "etatBache", servoAngle == SERVO_CLOSE ? "FERMEE" : "OUVERTE");
    Firebase.setInt(fbdo, basePath + "angleBache", servoAngle);
    Firebase.setString(fbdo, basePath + "pompe", pompeState ? "ON" : "OFF");
    Firebase.setString(fbdo, basePath + "mode", currentMode);
  }

  // 🔥 CHANGEMENT 4: Délai réduit de 500ms à 100ms pour réactivité
  // Si une commande vient d'arriver (forceUpdate=true), on attend moins longtemps
  if (forceUpdate) {
    delay(50);  // Très court délai pour réaction rapide
    forceUpdate = false;
  } else {
    delay(100);  // Délai normal réduit (était 500ms)
  }
}
