// ============================================================
// SchoolMoney – MongoDB Seed Script
// Baza: schoolmoney_db
// Uruchomienie: mongosh -u admin -p admin --authenticationDatabase admin schoolmoney_db seed.js
// ============================================================

// ---------- Czyszczenie kolekcji ----------
db.users.drop();
db.classes.drop();
db.children.drop();
db.fundraisers.drop();
db.transactions.drop();
db.messages.drop();

// ---------- Użytkownicy ----------
// Hasło: "password123" → bcrypt hash (koszt 10)
const BCRYPT_PASSWORD = "$2a$10$7Qg3e6NmGfH0aXkLlKjMKuV.9kJGqTPHY3VgMhD5lCx8ERnNSH7Gy";

db.users.insertMany([
  {
    _id: ObjectId("65f0000000000000000000a1"),
    email: "admin@schoolmoney.pl",
    password: BCRYPT_PASSWORD,
    firstName: "Anna",
    lastName: "Kowalska",
    avatarUrl: null,
    role: "ROLE_ADMIN",
    virtualAccountNumber: "SM-ADMIN-000001",
    balance: NumberDecimal("0.00"),
    isBlocked: false
  },
  {
    _id: ObjectId("65f0000000000000000000a2"),
    email: "skarbnik@schoolmoney.pl",
    password: BCRYPT_PASSWORD,
    firstName: "Piotr",
    lastName: "Nowak",
    avatarUrl: null,
    role: "ROLE_TREASURER",
    virtualAccountNumber: "SM-TREAS-000001",
    balance: NumberDecimal("150.00"),
    isBlocked: false
  },
  {
    _id: ObjectId("65f0000000000000000000a3"),
    email: "rodzic1@schoolmoney.pl",
    password: BCRYPT_PASSWORD,
    firstName: "Maria",
    lastName: "Wiśniewska",
    avatarUrl: null,
    role: "ROLE_PARENT",
    virtualAccountNumber: "SM-PAREN-000001",
    balance: NumberDecimal("200.00"),
    isBlocked: false
  },
  {
    _id: ObjectId("65f0000000000000000000a4"),
    email: "rodzic2@schoolmoney.pl",
    password: BCRYPT_PASSWORD,
    firstName: "Tomasz",
    lastName: "Jabłoński",
    avatarUrl: null,
    role: "ROLE_PARENT",
    virtualAccountNumber: "SM-PAREN-000002",
    balance: NumberDecimal("50.00"),
    isBlocked: false
  },
  {
    _id: ObjectId("65f0000000000000000000a5"),
    email: "rodzic3@schoolmoney.pl",
    password: BCRYPT_PASSWORD,
    firstName: "Katarzyna",
    lastName: "Zielińska",
    avatarUrl: null,
    role: "ROLE_PARENT",
    virtualAccountNumber: "SM-PAREN-000003",
    balance: NumberDecimal("0.00"),
    isBlocked: true
  }
]);

// ---------- Klasy ----------
db.classes.insertMany([
  {
    _id: ObjectId("65f0000000000000000000b1"),
    name: "3A – Szkoła Podstawowa nr 5",
    treasurerId: "65f0000000000000000000a2",
    inviteToken: "TOKEN-3A-2025"
  },
  {
    _id: ObjectId("65f0000000000000000000b2"),
    name: "2B – Szkoła Podstawowa nr 5",
    treasurerId: "65f0000000000000000000a2",
    inviteToken: "TOKEN-2B-2025"
  }
]);

// ---------- Dzieci ----------
db.children.insertMany([
  {
    _id: ObjectId("65f0000000000000000000c1"),
    firstName: "Zofia",
    lastName: "Wiśniewska",
    avatarUrl: null,
    dateOfBirth: new Date("2016-03-12"),
    parentId: "65f0000000000000000000a3",
    classId: "65f0000000000000000000b1"
  },
  {
    _id: ObjectId("65f0000000000000000000c2"),
    firstName: "Mikołaj",
    lastName: "Jabłoński",
    avatarUrl: null,
    dateOfBirth: new Date("2017-07-25"),
    parentId: "65f0000000000000000000a4",
    classId: "65f0000000000000000000b1"
  },
  {
    _id: ObjectId("65f0000000000000000000c3"),
    firstName: "Hanna",
    lastName: "Zielińska",
    avatarUrl: null,
    dateOfBirth: new Date("2018-01-05"),
    parentId: "65f0000000000000000000a5",
    classId: null
  }
]);

// ---------- Zbiórki ----------
db.fundraisers.insertMany([
  {
    _id: ObjectId("65f0000000000000000000d1"),
    classId: "65f0000000000000000000b1",
    creatorId: "65f0000000000000000000a2",
    title: "Wycieczka do Krakowa",
    description: "Jednodniowa wycieczka autokarowa do Krakowa dla klasy 3A. Obejmuje wstęp do Wawelu i lunch.",
    logoUrl: null,
    startDate: new Date("2025-09-01"),
    endDate: new Date("2025-09-30"),
    amountPerChild: NumberDecimal("80.00"),
    virtualAccountNumber: "SM-FUND-000001",
    balance: NumberDecimal("80.00"),
    status: "ACTIVE",
    receiptUrls: [],
    isBlocked: false,
    isPublic: true
  },
  {
    _id: ObjectId("65f0000000000000000000d2"),
    classId: "65f0000000000000000000b1",
    creatorId: "65f0000000000000000000a2",
    title: "Ubezpieczenie NNW 2025/2026",
    description: "Składka na ubezpieczenie od następstw nieszczęśliwych wypadków na rok szkolny 2025/2026.",
    logoUrl: null,
    startDate: new Date("2025-08-15"),
    endDate: new Date("2025-09-15"),
    amountPerChild: NumberDecimal("25.00"),
    virtualAccountNumber: "SM-FUND-000002",
    balance: NumberDecimal("0.00"),
    status: "CLOSED",
    receiptUrls: [],
    isBlocked: false,
    isPublic: false
  }
]);

// ---------- Transakcje ----------
db.transactions.insertMany([
  {
    _id: ObjectId("65f0000000000000000000e1"),
    fromAccountNumber: "SM-PAREN-000001",
    toAccountNumber: "SM-PAREN-000001",
    amount: NumberDecimal("200.00"),
    type: "DEPOSIT",
    fundraiserId: null,
    classId: null,
    childId: null,
    payerId: "65f0000000000000000000a3",
    timestamp: new Date("2025-09-01T09:00:00Z")
  },
  {
    _id: ObjectId("65f0000000000000000000e2"),
    fromAccountNumber: "SM-PAREN-000001",
    toAccountNumber: "SM-FUND-000001",
    amount: NumberDecimal("80.00"),
    type: "PAYMENT",
    fundraiserId: "65f0000000000000000000d1",
    classId: "65f0000000000000000000b1",
    childId: "65f0000000000000000000c1",
    payerId: "65f0000000000000000000a3",
    timestamp: new Date("2025-09-05T10:30:00Z")
  },
  {
    _id: ObjectId("65f0000000000000000000e3"),
    fromAccountNumber: "SM-PAREN-000002",
    toAccountNumber: "SM-PAREN-000002",
    amount: NumberDecimal("50.00"),
    type: "DEPOSIT",
    fundraiserId: null,
    classId: null,
    childId: null,
    payerId: "65f0000000000000000000a4",
    timestamp: new Date("2025-09-03T14:00:00Z")
  }
]);

// ---------- Wiadomości ----------
db.messages.insertMany([
  {
    _id: ObjectId("65f0000000000000000000f1"),
    senderId: "65f0000000000000000000a2",
    receiverId: null,
    classId: "65f0000000000000000000b1",
    content: "Witajcie! Uruchomiliśmy zbiórkę na wycieczkę do Krakowa. Proszę o wpłaty do 30 września.",
    timestamp: new Date("2025-09-01T08:00:00Z")
  },
  {
    _id: ObjectId("65f0000000000000000000f2"),
    senderId: "65f0000000000000000000a3",
    receiverId: "65f0000000000000000000a2",
    classId: null,
    content: "Dzień dobry, czy wycieczka jest obowiązkowa?",
    timestamp: new Date("2025-09-02T11:15:00Z")
  },
  {
    _id: ObjectId("65f0000000000000000000f3"),
    senderId: "65f0000000000000000000a2",
    receiverId: "65f0000000000000000000a3",
    classId: null,
    content: "Nie, wycieczka jest dobrowolna, ale bardzo zachęcamy do udziału!",
    timestamp: new Date("2025-09-02T11:45:00Z")
  }
]);

print("✅ Seed zakończony pomyślnie.");
print("   Kolekcje: users(5), classes(2), children(3), fundraisers(2), transactions(3), messages(3)");
