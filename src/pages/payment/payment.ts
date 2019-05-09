export class Payment {
  _id: string;
  _serviceProvider: any;
  stripeTransferAmount: string;
  transactionDate: Date;
  amount: number;
  tip: number;
  _requests: any[];
  _invoice: string;
  message: string;
  displayTip: boolean;
  uuid?: string;
  invoiceTotal: number;
  _payingUser: any;
  percentOfInvoice: number;
  updatedAt: Date;
  createdAt: Date;
}
