import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { Request } from './request';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class RequestService {
  requests: Request[] = [];
  groupedRequests: any[] = [];
  payments: any[] = [];
  request: Request;

  constructor(
    public constants: ConstantsService,
    private http: Http,
    public toastCtrl: ToastController,
  ) { }

  /**
   * Retrieves a single object via API
   * @param  {String} id  The id for the object to be retrieved
   * @param  {String} horseId  The horseId for getting a request specific to horse
   * @return {Promise}    The $http request
   */
  get(id: string, horseId?: string): Promise<Request> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests/${id}`;
    if (horseId) {queryUrl += `/${horseId}`; }

    return this.http.get(queryUrl)
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
  query(params: {}): Promise<Request[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().requests);
  }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  querySchedule(params: {}): Promise<Request[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests/schedule?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().requests);
  }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  queryWithGroups(params: {}): Promise<Request[]> {

    let queryUrl = `${this.constants.API_BASE_URL}/requests/groupedByHorse?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().requests);
  }

  /**
   * Retrieves all requests with upcoming services for the authenticated user
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  getUpcoming(params: {}): Promise<Request[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests/upcomingRequests`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().requests);
  }

  /**
   * Creates a new object via API
   * Adds the new object to this.requests
   * @param  {Request} request  The request object to be created
   * @return {Promise}        The $http request
   */
  create(request: Request): Promise<Request> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests?`;

    return this.http.post(queryUrl, request)
      .toPromise()
      .then((response) => {
        if (response) {
          this.requests.unshift(response.json());
        }

        return response.json();
      });
  }

  /**
   * Updates an object via API
   * @param  {Object} object  The object to be updated
   * @return {Promise}        The $http request
   */
  update(request: Request): Promise<Request> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests/${request._id}`;

    return this.http.put(queryUrl, request)
      .toPromise()
      .then((response) => {
        // Update the request
        if (response) {
          this.request = response.json();

          // If object exists in this.requests, update it
          let index = this.requests.findIndex((o) => o._id === this.request._id);
          if (index > -1) {
            this.requests[index] = response.json();
          }
        }

        return response.json();
      });
  }

  /**
   * Updates a Request status via API
   * @param  {Object} request The request to be updated
   * @param  {String} status  The new status of the request
   * @return {Promise}        The $http request
   */
  updateStatus(request: Request, status: string): Promise<Request> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests/${request._id}/status/${status}`;

    return this.http.put(queryUrl, request)
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Updates a Request status via API
   * @param  {Object} request  The request object to be dismissed
   * @return {Promise}        The $http request
   */
  dismiss(request: Request): Promise<Request> {
    let queryUrl = `${this.constants.API_BASE_URL}/requests/${request._id}/dismiss`;

    return this.http.put(queryUrl, request)
      .toPromise()
      .then((response) => {
        return response.json();
      });
  }

  /**
   * Delete an object via API
   * If it exists, remove object from this.requests
   * @param  {String} id  The id for the object to be deleted
   * @return {Promise}    The $http request
   */
  delete(id: string): Promise<void> {
    return this.http.delete(`${this.constants.API_BASE_URL}/requests/${id}`)
      .toPromise()
      .then((response) => {

        // If object exists in this.requests, update it
        let index = this.requests.findIndex((o) => o._id === id);
        if (index > -1) {
          this.requests.splice(index, 1);
        }
      });
  }

  /**
   * Delete multiple objects via API
   * If it exists, remove object from this.requests
   * @param  {Array} requestIds  Array of request ids
   * @return {Promise}    The $http request
   */
  deleteMultiple(requestIds: string[]): Promise<void> {
    const queryUrl = `${this.constants.API_BASE_URL}/requests/deleteMultiple`;

    return this.http.post(queryUrl, { ids: requestIds })
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
   * Util function to display a success message
   * @param {string} message Success message to display
   */
  handleSuccess(message: string) {
    const toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: 'toast-success',
    });
    toast.present();
  }

  /**
   * Check if a give request is pending (not accepted or rejected)
   * @param {Request} request The Request object
   */
  isPending(request: Request) {
    return !request.acceptedAt && !request.declinedAt && !request.completedAt && !request.deletedAt;
  }

  /**
   * Check if a give request is accepted but not completed or deleted
   * @param {Request} request The Request object
   */
  isAccepted(request: Request) {
    return request.acceptedAt && !request.completedAt && !request.declinedAt && !request.deletedAt;
  }

  isPreviouslyReassigned(request: Request) {
    return request._previousReassignees && request._previousReassignees.length > 0;
  }

  currentAssignee(request: Request) {
    let assignee;
    if (request._reassignedTo) {
      assignee = request._reassignedTo;
    } else {
      assignee = request._serviceProvider;
    }
    return assignee;
  }
}
