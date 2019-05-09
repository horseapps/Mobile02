import { User } from '../user/user';
interface Owner {
  _user: User;
  percentage: number;
}

export class Horse {
  _id: string;
  barnName: string;
  showName: string;
  gender: string;
  color: string;
  sire?: string;
  dam?: string;
  height: string;
  description: string;
  avatar: any;
  _owners: Owner[];
  _owner?: User;
  _leasedTo: any;
  _createdBy: any;
  _trainer: any;
  registrations: any[];
  nextBraiding: string;
  birthYear?: string;
  updatedAt: Date;
  createdAt: Date;
}
