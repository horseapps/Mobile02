import { Injectable } from '@angular/core';
import { ToastController, Events } from 'ionic-angular';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { Storage } from '@ionic/storage';

import { User } from './user';
import { ConstantsService } from '../../providers/constants.service';

// Import RxJs required methods
import 'rxjs/add/operator/toPromise';

@Injectable()
export class UserService {
  user: any;
  paymentApprovals: Array<{}>;
  ownerAuthorizations: Array<{}>;
  groupedServiceProviders: Array<{}>;

  constructor(
    private storage: Storage,
    private http: Http,
    public constants: ConstantsService,
    private toastCtrl: ToastController,
    public events: Events,
  ) {
    // Prevent next user who logs in from seeing last user's relationships
    this.events.subscribe('user:logged-out', () => {
      this.paymentApprovals = null;
      this.ownerAuthorizations = null;
      this.groupedServiceProviders = null;
    });
  }

  get(id: string) {
    return this.http.get(`${this.constants.API_BASE_URL}/users/${id}`)
      .toPromise()
      .then((response) => {
         return response.json();
      });
  }

  create(object: {}) {
    return this.http.post(`${this.constants.API_BASE_URL}/users/signup`, object)
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  query(params: {}): Promise<User[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/users?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().users);
  }

  /**
   * Submit payment token to server for saving a payment method
   * @param {object} object Stripe token object
   */
  submitPaymentToken(object: any) {
    return this.http.post(`${this.constants.API_BASE_URL}/users/me/stripePaymentSetup`, object)
      .toPromise()
      .then((response) => {
        return response.json;
      });
  }

  /**
   * Get temporary url for user's Stripe dashboard
   */
  getStripeDashboardUrl() {
    return this.http.get(`${this.constants.API_BASE_URL}/users/stripe/dashboardUrl`)
      .toPromise()
      .then((response) => {
         return response.json();
      });
  }

  getGroupedServiceProviders() {
    return this.http.get(`${this.constants.API_BASE_URL}/users/providers/grouped`)
    .toPromise()
    .then((response) => {
      return response.json();
    });
  }

  deleteServiceProvider(id: string): Promise<void> {
    return this.http.delete(`${this.constants.API_BASE_URL}/users/providers/deleteServiceProvider/${id}`)
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

   // Returns the collection of payment approvers that the user has added
  getPaymentApprovals() {
    this.paymentApprovals = this.user.paymentApprovals;
  }

  // Returns a collection of authorizing owners and the amounts authorized
  getOwnerAuthorizations() {
    return this.http.get(`${this.constants.API_BASE_URL}/users/approvals/ownerAuthorizations`)
    .toPromise()
    .then((response) => {
      this.ownerAuthorizations = response.json();
    });
  }

  /**
   * Adds a payment approver to the current horse manager's collection
   * @param  {Object} object The approver's ID and max amount approved
   * @return {Promise}       The $http request
   */
  addPaymentApproval(approvalData: {}) {
    return this.http.post(`${this.constants.API_BASE_URL}/users/approvals/addPaymentApproval`, approvalData)
    .toPromise()
    .then((response) => {
      return response.json();
    });
  }

  updatePaymentApproval(approvalData: {}) {
    return this.http.put(`${this.constants.API_BASE_URL}/users/approvals/updatePaymentApproval`, approvalData)
    .toPromise()
    .then((response) => {
      return response.json();
    });
  }

  /**
   * Adds a payment approver to the current horse manager's collection
   * @param  {Object} object The approval to be deleted from the user
   * @return {Promise}       The $http request
   */
  deletePaymentApproval(id: string): Promise<void> {
    return this.http.delete(`${this.constants.API_BASE_URL}/users/approvals/deletePaymentApproval/${id}`)
    .toPromise()
    .then((response) => {
      return response.json();
    });
  }

  /**
   * Adds a payment approver to the current horse manager's collection
   * @param  {Object} object The approver's ID and max amount approved
   * @return {Promise}       The $http request
   */
  addServiceProvider(providerData: {}) {
    return this.http.post(`${this.constants.API_BASE_URL}/users/providers/addServiceProvider`, providerData)
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Updates the current user with '/me' via API
   * @param  {Object} object  The object to be updated
   * @return {Promise}        The $http request
   */
  updateMe(object: User) {
    return this.http.put(`${this.constants.API_BASE_URL}/users/me`, object)
      .toPromise()
      .then((response) => {
        if (response) {
          this.user = response.json();
        }

        return response.json();
      });
  }

  /**
   * Return the avatar url for given user or placeholder if no avatar exists
   * @param {User} user The User object
   * @return {String} Avatar url string
   */
  getAvatarUrlForUser(user: User) {
    if (!user.avatar) {
      return 'assets/images/avatar-placeholder.png';
    } else if (user.avatar.styles && user.avatar.styles.thumb_square) {
      return `${this.constants.AWS_S3_BASE_URL}/${user.avatar.styles.thumb_square}`;
    } else {
      return `${this.constants.AWS_S3_BASE_URL}/${user.avatar.url}`;
    }
  }

  /**
   * Securly changes the password for a user
   * @param  {Object} object The user's passwords
   * @return {Promise}       The $http request
   */
  changePassword(object: any) {
    const params = { oldPassword: object.oldPassword, newPassword: object.newPassword };
    return this.http.put(`${this.constants.API_BASE_URL}/users/me/password`, params)
      .toPromise()
      .then((response) => {
        return response;
      });
  }

  /**
   * Util function to display an error
   * @param {string} errorMessage Error message to display
   */
  handleError(errorMessage: string) {
    const toast = this.toastCtrl.create({
      message: errorMessage,
      duration: 3000,
      cssClass: 'toast-danger',
    });
    toast.present();
  }

}
