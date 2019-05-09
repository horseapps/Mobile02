import { Injectable } from '@angular/core';
import { Http  } from '@angular/http';
import { ConstantsService } from '../../providers/constants.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class LegalService {
  constructor(
    private http: Http,
    public constants: ConstantsService,
  ) {}

  getTerms() {
    return this.http.get(`${this.constants.API_BASE_URL}/legal/terms`)
      .toPromise()
      .then((response) => {
        return response.json().termsOfService;
      });
  }

  getPrivacyPolicy() {
    return this.http.get(`${this.constants.API_BASE_URL}/legal/privacy`)
      .toPromise()
      .then((response) => {
        return response.json().privacyPolicy;
      });
  }
}
