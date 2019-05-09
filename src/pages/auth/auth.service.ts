import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import { ModalController, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Rx';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';

import { UserService } from '../user/user.service';
import { User } from '../user/user';
import { ConstantsService } from '../../providers/constants.service';

const SERVICE_PROVIDER: string = 'service provider';
const MANAGER: string = 'horse manager';

@Injectable()
export class AuthService {
  currentUser: any = null;

  constructor(
    public storage: Storage,
    public modalCtrl: ModalController,
    public http: Http,
    public constants: ConstantsService,
    public events: Events,
    private userService: UserService,
  ) { }

  login(email: string, password: string) {
    const url = `${this.constants.API_BASE_URL}/auth/login`;
    const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const data = 'email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password);
    const options = new RequestOptions({ headers: headers });

    return this.http.post(url, data, options)
      .toPromise()
      .then((response) => {
        const parsedResponse = response.json();

        return this.setToken(parsedResponse.token)
          .then(() => {
            return this.getCurrentUser()
              .then((currentUser) => {
                this.currentUser = currentUser;
                this.events.publish('user:logged-in');
              });
          });
      });
  }

  setToken(token: string) {
    return this.storage.set('token', token);
  }

  getCurrentUser() {
    return this.userService.get('me');
  }

  logout() {
    this.storage.remove('token');
    this.currentUser = null;
    this.events.publish('user:logged-out');
  }

  resetPassword(email: string): Promise<any> {
    const url = `${this.constants.API_BASE_URL}/users/me/forgot`;

    return this.http.put(url, { email })
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Check if current user is a horse manager
   * @return boolean true/false
   */
  isManager() {
    return this.currentUser && this.currentUser.roles.includes(MANAGER);
  }

  /**
   * Check if current user is a service provider
   * @return boolean true/false
   */
  isServiceProvider() {
    return this.currentUser && this.currentUser.roles.includes(SERVICE_PROVIDER);
  }

  /**
   * Returns boolean if current user has payment setup depending on user type
   */
  hasPaymentSetup() {
    if (this.isManager()) {
      return !!this.currentUser.stripeCustomerSetup;
    }

    if (this.isServiceProvider()) {
      return !!this.currentUser.stripeAccountApproved;
    }
  }

}
