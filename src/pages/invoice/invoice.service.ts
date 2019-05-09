import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { Invoice } from './invoice';
import { User } from '../user/user';
import { Request } from '../request/request';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';
import moment from 'moment';

@Injectable()
export class InvoiceService {
  invoices: Invoice[] = [];
  invoice: Invoice;

  constructor(
    public constants: ConstantsService,
    private http: Http,
    public toastCtrl: ToastController,
  ) { }

  /**
   * Retrieves a single object via API
   * @param  {String} id  The id for the object to be retrieved
   * @return {Promise}    The $http invoice
   */
  get(id: string): Promise<Invoice> {
    // If object exists in this.invoices, use that invoice
    let index = this.invoices.findIndex((o) => o._id === id);
    if (index > -1) {
      this.invoice = this.invoices[index];
      return new Promise((resolve, reject) => {
        resolve(this.invoice);
      });

    } else {
      let queryUrl = `${this.constants.API_BASE_URL}/invoices/${id}`;
      return this.http.get(queryUrl)
        .toPromise()
        .then((response) => {
          return response.json();
        });
    }
  }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http invoice
   */
  query(params: {}): Promise<Invoice[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().invoices);
  }

  /**
   * Creates a new object via API
   * Adds the new object to this.invoices
   * @param  {Invoice} invoice  The invoice object to be created
   * @return {Promise}        The $http invoice
   */
  create(invoice: Invoice): Promise<Invoice> {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices?`;

    return this.http.post(queryUrl, invoice)
      .toPromise()
      .then((response) => {
        if (response) {
          this.invoices.unshift(response.json());
        }

        return response.json();
      });
  }

  /**
   * Updates an object via API
   * @param  {Object} object  The object to be updated
   * @return {Promise}        The $http invoice
   */
  update(invoice: Invoice): Promise<Invoice> {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/${invoice._id}`;

    return this.http.put(queryUrl, invoice)
      .toPromise()
      .then((response) => {
        // Update the invoice
        if (response) {
          this.invoice = response.json();

          // If object exists in this.invoices, update it
          let index = this.invoices.findIndex((o) => o._id === this.invoice._id);
          if (index > -1) {
            this.invoices[index] = response.json();
          }
        }

        return response.json();
      });
  }

  /**
   * Sends an email/push notification to the main service provider
   * @param {string} serviceProviderId The service provider id
   */
  requestSubmission(requests: Request[]) {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/requestSubmission?`;

    return this.http.post(queryUrl, { requests })
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Check if the previous listed request on the page has the same service date
   * @param {Array} group The request group being checked
   * @param {Object} request The specific request in the group being checked
   * @param {Number} index The index of the specific request being checked
   * @return {Boolean} Returns true if the previous request in the list has the same date
   */
  previousRequestHasSameDate(group: any[], request: any, index: number) {
    if (index < 1) {
      return false;
    } else {
      const previousRequest = group[index - 1];
      return previousRequest.date === request.date;
    }
  }

  /**
   * Calculate the total of all the requests
   * @param {Array} requests Array of requests
   */
  calculateTotal(requests: Request[]) {
    const total = requests.reduce(
      (accumulator, currentValue) => {
        return accumulator + currentValue.total;
      },
      0,
    );

    return total;
  }

  /**
   * Calculate the total of services the main service provider completed
   * @param {Array} requests Array of request
   */
  calculateTotalForMainProvider(requests: Request[]) {
    let total = 0;

    requests.forEach((request) => {
      if (!request._reassignedTo) {
        total += request.total;
      }
    });

    return total;
  }

  /**
   * Sends email to paying user requesting payment approval
   * @param  {Object} invoiceInformation  Invoice information object with invoice, payer, and amount owed
   * @return {Promise}        The $http request
   */
  requestApproval(invoiceInformation: any) {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/requestApproval?`;

    return this.http.post(queryUrl, invoiceInformation)
      .toPromise()
      .then((response) => response.json());
  }

  /**
   * Sends email to paying user requesting payment approval
   * @param  {Object} invoiceInformation  Invoice information object with invoice, payer, and amount owed
   * @return {Promise}        The $http request
   */
  requestApprovalIncrease(invoiceInformation: any) {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/requestApprovalIncrease?`;

    return this.http.post(queryUrl, invoiceInformation)
      .toPromise()
      .then((response) => response.json());
  }

  /**
   * Sends email to paying users requesting invoice payment
   * @param  {Object} invoice  Invoice invoice object
   * @return {Promise}        The $http request
   */
  requestPayment(invoice: Invoice) {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/requestPayment?`;

    return this.http.post(queryUrl, invoice)
      .toPromise()
      .then((response) => response.json());
  }

  /**
   * Soft delete on an invoice
   * @param  {Object} invoice  Invoice invoice object
   * @return {Promise}        The $http request
   */
  delete(invoice: Invoice) {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/${invoice._id}?`;

    return this.http.delete(queryUrl)
      .toPromise()
      .then((response) => response.json());
  }

  // Find the invoice and remove it from list of invoices
  removeInvoice(invoiceId: string) {
    let index = this.invoices.findIndex((o) => o._id === invoiceId);
    if (index > -1) {
      this.invoices.splice(index, 1);
    }
  }

  /**
   * Check if the invoice start and end date are the same
   * @param {Invoice} invoice The invoice object
   */
  sameStartEndDate(invoice: Invoice) {
    const minDateStart = moment(invoice.minDate).startOf('day');
    const maxDateStart = moment(invoice.maxDate).startOf('day');
    return moment(minDateStart).isSame(maxDateStart);
  }

  /**
   * Check if the invoice start and end date are the same
   * @param {any} queryData The constraints on which invoices will be exported
   */
  exportToCsv(queryData: {}) {
    let queryUrl = `${this.constants.API_BASE_URL}/invoices/exportToCsv?`;

    return this.http.post(queryUrl, queryData)
      .toPromise()
      .then((response) => response.json());
  }

  /**
   * Check if given user is a payment approver, but not a payer, for given invoice
   * @param {User} user The user whose approver status is being checked
   * @param {Invoice} invoice The invoice whose payers and approvers are being checked
   */
  hasPaymentApproverForInvoice(user: User, invoice: Invoice) {
    let isPayer = false;
    const payerIds = invoice._payingUsers.map((u) => String(u._user._id));
    payerIds.forEach((payerId) => {
      // If the user is a paying user, they're not *just* an approver, so return false
      if (String(user._id) === payerId) {
        isPayer = true;
      }
    });
    // Find a paymentApproval where the _payer is the given payer, and _approver is the current user
    const matchedPaymentApprover = invoice.paymentApprovals.find((paymentApproval) => {
      return paymentApproval._approver._id === user._id;
    });
    // console.log('matchedPaymentApprover');
    return !!matchedPaymentApprover && !isPayer;
  }

  displayCreatedAt(invoice: Invoice) {
    const newVersionDate = new Date('2018-08-24').setHours(0, 0, 0, 0);
    const createdDate = new Date(String(invoice.createdAt)).setHours(0, 0, 0, 0);
    if (createdDate > newVersionDate) {
      return invoice.createdAt;
    } else {
      // If this invoice was grandfathered in, we'll filter using the first request's date
      return new Date(String(invoice._requests[0].createdAt)).setHours(0, 0, 0, 0);
    }
  }
}
