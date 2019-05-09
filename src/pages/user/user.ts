export class User {
  _id: string;
  name: string;
  email: string;
  barn: string;
  location: string;
  phone: string;
  token: string;
  accountSetupComplete: boolean;
  stripeAccountApproved: boolean;
  services: any[];
  avatar: any;
  roles?: any;
  paymentApprovals: any[];
  privateNotes: any[];
}
