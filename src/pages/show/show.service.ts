import { Injectable } from '@angular/core';
import { Show } from './show';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ShowService {

  constructor(
    public constants: ConstantsService,
    private http: Http,
  ) { }

  /**
   * Retrieves all objects matching a query via API
   * @param  {Object} params The parameters for the query
   * @return {Promise}    The $http request
   */
  query(params: {}): Promise<Show[]> {
    let queryUrl = `${this.constants.API_BASE_URL}/shows?`;

    let serializedParams = new URLSearchParams();
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        serializedParams.set(key, params[key]);
      }
    }

    queryUrl += serializedParams.toString();

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => response.json().shows);
  }
}
