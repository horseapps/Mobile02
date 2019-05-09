import { User } from '../user/user';
import { Horse } from '../horse/horse';

interface Owner {
  _user: User;
  percentage: number;
}

export class Request {
  _id: string;
  date: any;
  _show: any;
  fromCustomInvoice: boolean;
  competitionClass: string;
  _horse: Horse;
  _horseManager: any;
  _serviceProvider: any;
  _reassignedTo: any;
  _previousReassignees: User[];
  services: any[];
  instructions: string;
  providerNotes: string;
  total: number;
  deletedAt: Date;
  dateOnly: any;
  paidAt: Date;
  declinedAt: Date;
  acceptedAt: Date;
  completedAt: Date;
  dismissedBy: any;
  updatedAt: Date;
  createdAt: Date;
  servicesError: boolean;
  addedToInvoice?: boolean;
  _leasedTo: User;
  _owners: Owner[];
  declinedByHeadServiceProvider: boolean;
}
