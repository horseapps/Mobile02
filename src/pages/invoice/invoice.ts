import { User } from '../user/user';
import { Horse } from '../horse/horse';
import { Request } from '../request/request';
import { Payment } from '../payment/payment';

interface Owner {
  _user: User;
  percentage: number;
}

interface PaymentApproval {
  _approver: User;
  _payer?: User | string;
  isUnlimited: boolean;
  maxAmount: number;
}

export class Invoice {
  _id: string;
  amount: number;
  tip: number;
  paidOutsideAppAt: boolean;
  paidInFullAt: Date;
  _owners: Owner[];
  _payingUsers: Owner[];
  paymentApprovals: PaymentApproval[];
  _leasee: User;
  _horse: Horse;
  _serviceProvider: User;
  _trainer: User;
  _reassignees: User[];
  _requests: Request[];
  _payments?: Payment[];
  fromDataMigration?: boolean;
  minDate?: Date;
  maxDate?: Date;
  createdAt: Date;
}
