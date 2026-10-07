/**
 * Syrian governorates, Turkish provinces, and US states
 * for the country-specific region dropdown.
 */

export const SYRIA_GOVERNORATES = [
  { code: "DM",  ar: "دمشق",        tr: "Şam",          en: "Damascus" },
  { code: "RD",  ar: "ريف دمشق",     tr: "Şam Kırsalı",  en: "Rif Dimashq" },
  { code: "HL",  ar: "حلب",         tr: "Halep",        en: "Aleppo" },
  { code: "HM",  ar: "حمص",         tr: "Humus",        en: "Homs" },
  { code: "HA",  ar: "حماة",        tr: "Hama",         en: "Hama" },
  { code: "LT",  ar: "اللاذقية",     tr: "Lazkiye",      en: "Latakia" },
  { code: "TR",  ar: "طرطوس",       tr: "Tartus",       en: "Tartus" },
  { code: "ID",  ar: "إدلب",        tr: "İdlib",        en: "Idlib" },
  { code: "DA",  ar: "درعا",        tr: "Dera",         en: "Daraa" },
  { code: "SU",  ar: "السويداء",    tr: "Suveyda",      en: "As-Suwayda" },
  { code: "QU",  ar: "القنيطرة",    tr: "Kuneytra",     en: "Quneitra" },
  { code: "RQ",  ar: "الرقة",       tr: "Rakka",        en: "Raqqa" },
  { code: "DZ",  ar: "دير الزور",   tr: "Deyrizor",     en: "Deir ez-Zor" },
  { code: "HS",  ar: "الحسكة",      tr: "Haseke",       en: "Al-Hasakah" },
];

export const TURKEY_PROVINCES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin",
  "Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur",
  "Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan",
  "Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay","Iğdır","Isparta","İstanbul",
  "İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli",
  "Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş",
  "Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop",
  "Şırnak","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak",
].map((name) => ({ code: name, ar: name, tr: name, en: name }));

export const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
].map(([code, name]) => ({ code, ar: name, tr: name, en: name }));

export const getRegionsByCountry = (countryCode) => {
  if (countryCode === "SY") return SYRIA_GOVERNORATES;
  if (countryCode === "TR") return TURKEY_PROVINCES;
  if (countryCode === "US") return US_STATES;
  return [];
};
