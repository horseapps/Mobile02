import { Injectable } from '@angular/core';
import { ToastController, Events } from 'ionic-angular';
import { Horse } from './horse';
import { User } from '../user/user';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';

interface Owner {
  _user: User;
  percentage: number;
}

@Injectable()
export class HorseService {
  horse: Horse;
  horses: Horse[] = [];

  constructor(
    public constants: ConstantsService,
    private http: Http,
    public toastCtrl: ToastController,
    public events: Events,
  ) {
    // Prevent next user who logs in from seeing last user's horses
    this.events.subscribe('user:logged-out', () => {
      this.horse = null;
      this.horses = null;
    });
  }

  /**
   * Retrieves a single object via API
   * @param  {String} id  The id for the object to be retrieved
   * @return {Promise}    The $http request
   */
  get(id: string): Promise<Horse> {
    // If object exists in this.horses, use that horse
    let index = this.horses.findIndex((o) => o._id === id);
    if (index > -1) {
      this.horse = this.horses[index];
      return new Promise((resolve, reject) => {
        resolve(this.horse);
      });

    } else {
      let queryUrl = `${this.constants.API_BASE_URL}/horses/${id}`;
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
   * @return {Promise}    The $http request
   */
  query(params: {}): Promise<Horse[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/horses?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().horses);
  }

  /**
   * Retrieves all horses with upcoming services for the authenticated user
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  getUpcoming(params: {}): Promise<Horse[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/horses/upcomingRequests?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();
    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().horses);
  }

  /**
   * Creates a new object via API
   * Adds the new object to this.horses
   * @param  {Horse} horse  The horse object to be created
   * @return {Promise}        The $http request
   */
  create(horse: Horse): Promise<Horse> {
    let queryUrl = `${this.constants.API_BASE_URL}/horses?`;

    return this.http.post(queryUrl, horse)
      .toPromise()
      .then((response) => {
        if (response) {
          this.horses.unshift(response.json());
        }

        return response.json();
      });
  }

  /**
   * Updates an object via API
   * If it exists, updates the matching object in this.horses
   * @param  {Object} object  The object to be updated
   * @return {Promise}        The $http request
   */
  update(horse: Horse): Promise<Horse> {
    let queryUrl = `${this.constants.API_BASE_URL}/horses/${this.horse._id}`;

    return this.http.put(queryUrl, horse)
      .toPromise()
      .then((response) => {
        // Update the horse
        if (response) {
          this.horse = response.json();

          // If object exists in this.horses, update it
          let index = this.horses.findIndex((o) => o._id === this.horse._id);
          if (index > -1) {
            this.horses[index] = response.json();
          }
        }

        return response.json();
      });
  }

  updateMultipleOwners(owners: Owner[]) {
    let queryUrl = `${this.constants.API_BASE_URL}/horses/${this.horse._id}/updateMultipleOwners`;

    return this.http.patch(queryUrl, owners)
      .toPromise()
      .then((response) => {
        // Update the horse
        if (response) {
          this.horse = response.json();

          // If object exists in this.horses, update it
          let index = this.horses.findIndex((o) => o._id === this.horse._id);
          if (index > -1) {
            this.horses[index] = response.json();
          }
        }

        return response.json();
      });
  }

  /**
   * Delete an object via API
   * If it exists, remove object from this.horses
   * @param  {String} id  The id for the object to be deleted
   * @return {Promise}    The $http request
   */
  delete(id: string): Promise<void> {
    return this.http.delete(`${this.constants.API_BASE_URL}/horses/${id}`)
      .toPromise()
      .then((response) => {

        // If object exists in this.horses, update it
        let index = this.horses.findIndex((o) => o._id === id);
        if (index > -1) {
          this.horses.splice(index, 1);
        }
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
   * Util function to display success message
   * @param {string} successMessage Success message to display
   */
  handleSuccess(successMessage: string) {
    const toast = this.toastCtrl.create({
      message: successMessage,
      duration: 3000,
      cssClass: 'toast-success',
    });
    toast.present();
  }

  /**
   * Return the avatar url for given horse or placeholder if no avatar exists
   * @param {User} user The Horse object
   * @return {String} Avatar url string
   */
  getAvatarUrlForHorse(horse: Horse) {
    if (!horse.avatar) {
      return 'assets/images/horse-avatar-placeholder.png';
    } else if (horse.avatar.styles && horse.avatar.styles.thumb_square) {
      return `${this.constants.AWS_S3_BASE_URL}/${horse.avatar.styles.thumb_square}`;
    } else {
      return `${this.constants.AWS_S3_BASE_URL}/${horse.avatar.url}`;
    }
  }
}
