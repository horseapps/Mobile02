import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { Payment } from './payment';
import { Request } from '../request/request';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';

interface RequestObject {
  requests: Request[];
  invoice?: string;
}

interface PaymentResponse {
  message: string;
  payment: Payment;
}

@Injectable()
export class PaymentService {
  payment: Payment;
  uuid: string;

  constructor(
    public constants: ConstantsService,
    private http: Http,
    public toastCtrl: ToastController,
  ) { }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  query(params: {}): Promise<Payment[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/payments?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().payments);
  }

  /**
   * Retrieves a single object via API
   * @param  {String} id  The id for the object to be retrieved
   * @return {Promise}    The $http request
   */
  get(id: string): Promise<Payment> {
    let queryUrl = `${this.constants.API_BASE_URL}/payments/${id}`;
    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => {
        return response.json();
      });

  }

  /**
   * Creates a new object via API
   * @param  {Payment} payment  The payment object to be created
   * @return {Promise}        The $http request
   */
  create(payment: Payment): Promise<PaymentResponse> {
    let queryUrl = `${this.constants.API_BASE_URL}/payments?`;

    return this.http.post(queryUrl, payment)
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Sends email to paying user reminding them to submit payment
   * @param  {Array} requestIds  Array of request ids
   * @return {Promise}        The $http request
   */
  requestPayment(requestIds: string[]) {
    let queryUrl = `${this.constants.API_BASE_URL}/payments/requestPayment?`;

    // Build query - sending array of request ids
    // Format should be: requests=request1&requests=request2
    requestIds.forEach((id, index) => {
      queryUrl += `requests=${id}`;

      if (index !== requestIds.length - 1) {
        queryUrl += '&';
      }
    });

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json());
  }

  /**
   * Notify the owner via email when a request group's total is over a payment approver's limit
   * @param  {Array} requests  Array of request objects
   * @return {Promise}        The $http request
   */
  reportUnapprovedPendingInvoice(requests: any[]) {
    return this.http.post(`${this.constants.API_BASE_URL}/payments/reportUnapproved`, { requests: requests })
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Mark all requests as paid via API and create a payment object in db
   * @param  {Object} requestObject  Object containing request ids and their invoice id
   * @return {Promise}        The $http request
   */
  markAsPaid(requestObject: RequestObject): Promise<Request> {
    let queryUrl = `${this.constants.API_BASE_URL}/payments/markAsPaid`;

    return this.http.post(queryUrl, requestObject)
      .toPromise()
      .then((response) => {
        return response.json();
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

  /**
   * UUID v4 generator - RFC4122 compliant
   * example output: 6bee52be-f84a-4205-937f-6a4217b92d7a
   */
  generateUUID(): string {
    let uuid = '', i, random;

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;

      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  }

  /**
   * Set a new uuid if the message is not related to the idempotent key
   * @param {string} message error message
   */
  setIdempotentKey(message: string) {
    if (message.indexOf('dempotent') === -1) {
      this.uuid = this.generateUUID();
    }
  }

  getIdempotentKey() {
    return this.uuid;
  }
}
