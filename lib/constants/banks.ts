export const PAKISTAN_BANKS = [
  // Mobile Wallets
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  
  // Major Banks
  { value: "hbl", label: "Habib Bank Limited (HBL)" },
  { value: "ubl", label: "United Bank Limited (UBL)" },
  { value: "mcb", label: "MCB Bank Limited" },
  { value: "abl", label: "Allied Bank Limited (ABL)" },
  { value: "nbp", label: "National Bank of Pakistan (NBP)" },
  { value: "bafl", label: "Bank Alfalah Limited" },
  { value: "meezanbank", label: "Meezan Bank Limited" },
  { value: "bankislami", label: "BankIslami Pakistan Limited" },
  { value: "faysal", label: "Faysal Bank Limited" },
  { value: "standardchartered", label: "Standard Chartered Bank Pakistan" },
  { value: "habibmetro", label: "Habib Metropolitan Bank" },
  { value: "citibank", label: "Citibank Pakistan" },
  { value: "summit", label: "Summit Bank Limited" },
  { value: "soneri", label: "Soneri Bank Limited" },
  { value: "askari", label: "Askari Bank Limited" },
  { value: "js", label: "JS Bank Limited" },
  { value: "dubai", label: "Dubai Islamic Bank Pakistan" },
  { value: "sindh", label: "Sindh Bank Limited" },
  { value: "samba", label: "Samba Bank Limited" },
  { value: "silk", label: "Silk Bank Limited" },
  { value: "punjab", label: "The Bank of Punjab" },
  { value: "khyber", label: "The Bank of Khyber" },
  { value: "apna", label: "Apna Microfinance Bank" },
  { value: "telenor", label: "Telenor Microfinance Bank" },
  { value: "u-microfinance", label: "U Microfinance Bank" },
  { value: "finca", label: "FINCA Microfinance Bank" },
  { value: "mobilink", label: "Mobilink Microfinance Bank" },
] as const

export type BankValue = typeof PAKISTAN_BANKS[number]["value"]
