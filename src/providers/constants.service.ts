import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ConstantsService {
  API_BASE_URL: string = 'https://horse-linc.herokuapp.com/api';
  // API_BASE_URL: string = 'localhost:3000/api';
  AWS_S3_BASE_URL: string = 'https://sm-horselinc.s3.amazonaws.com';
  ONESIGNAL_APP_ID: string = '990c922f-4713-4b1c-a973-bb0a19d7be17';
  GOOGLE_PROJECT_NUMBER: string = '974423753590';

  ADMIN_EMAIL: string = 'info@horselinc.com';
  ADMIN_PHONE: string = '8889805462';

  // // Live Stripe Client Info
  STRIPE_PUBLISHABLE_KEY: string = 'pk_live_sFiDk5GlthNU4OF0rjCRNSSG';
  STRIPE_REDIRECT_URI: string = 'https://horse-linc.herokuapp.com/api/users/stripeRedirect';
  STRIPE_CLIENT_ID: string = 'ca_CEZN2ehmpV9pqg9zPJWCDr586gRGVRtd';

  // Test Stripe Client Info
  // STRIPE_PUBLISHABLE_KEY: string = 'pk_test_SCjKq9ThYF4VfqNSDwwGtE2X';
  // STRIPE_REDIRECT_URI: string = 'https://horse-linc-staging.herokuapp.com/api/users/stripeRedirect';
  // STRIPE_REDIRECT_URI: string = 'localhost:3000/api/users/stripeRedirect';
  // STRIPE_CLIENT_ID: string = 'ca_CEZNwSz8Ft2LiSnDvRbL2DI9PJeKdZkX';

  STRIPE_PERCENTAGE: number;

  APP_STORE_LINK: string = 'https://itunes.apple.com/us/app/horselinc/id1347325341?ls=1&mt=8';
  PLAY_STORE_LINK: string = 'https://play.google.com/store/apps/details?id=com.HorseLinc';

  NO_NETWORK: string = 'none';

  GENDERS: string[] = [
    'Mare',
    'Gelding',
    'Stallion',
  ];

  STATUSES: any = {
    complete: 'complete',
    accept: 'accept',
    decline: 'decline',
    leave: 'leave',
  };

  constructor(
    private http: Http,
  ) {
    this.setStripeFee();
  }

  /**
   * Sets the Stripe percentage fee
   * @return {Promise} The $http request
   */
  setStripeFee(): Promise<number> {
    let queryUrl = `${this.API_BASE_URL}/fee`;

    return this.http.get(queryUrl)
      .toPromise()
      .then((response) => {
        this.STRIPE_PERCENTAGE = +response.json().fee;
        return this.STRIPE_PERCENTAGE;
      });
  }

  /**
   * Utility function that increases a given number by the current Stripe fee
   * @param {number} amount The number to increase by STRIPE_PERCENTAGE
   */
  addServiceFee(amount: number): number {
    // Calculate the service fee (STRIPE_PERCENTAGE of given amount)
    const serviceFee = +(amount * this.STRIPE_PERCENTAGE).toFixed(2);
    return amount + serviceFee;
  }
}
