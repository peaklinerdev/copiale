export interface PaymentMethod {
  id: string;
  name: string;
  accountLabel: string;
  hasNotes: boolean;
  notesLabel?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    accountLabel: 'Phone Number',
    hasNotes: true,
    notesLabel: 'Transfer Details / Receiver Name',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    accountLabel: 'Phone Number / Account Number',
    hasNotes: true,
    notesLabel: 'Transfer Details',
  },
  {
    id: 'awash_bank',
    name: 'Awash Bank',
    accountLabel: 'Account Number',
    hasNotes: true,
    notesLabel: 'Account Holder Name',
  },
  {
    id: 'dashen_bank',
    name: 'Dashen Bank',
    accountLabel: 'Account Number',
    hasNotes: true,
    notesLabel: 'Account Holder Name',
  },
  {
    id: 'bank_of_abyssinia',
    name: 'Bank of Abyssinia',
    accountLabel: 'Account Number',
    hasNotes: true,
    notesLabel: 'Account Holder Name',
  },
  {
    id: 'cash',
    name: 'Cash in Person',
    accountLabel: 'Location / Meeting Point',
    hasNotes: true,
    notesLabel: 'Contact Details',
  },
];

export const getPaymentMethodById = (id: string) => 
  PAYMENT_METHODS.find(method => method.id === id);
