import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { Notification } from './notification';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class NotificationService {

  constructor(
    public constants: ConstantsService,
    private http: Http,
    private toastCtrl: ToastController,
  ) { }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  query(params: {}): Promise<Notification[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/notifications?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().notifications);
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
