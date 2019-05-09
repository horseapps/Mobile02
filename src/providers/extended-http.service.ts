import { Injectable } from '@angular/core';
import { Firebase } from '@ionic-native/firebase';
import { Request, XHRBackend, RequestOptions, Response, Http, RequestOptionsArgs, Headers } from '@angular/http';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/fromPromise';

@Injectable()
export class ExtendedHttpService extends Http {

  constructor (
    backend: XHRBackend,
    options: RequestOptions,
    private storage: Storage,
    private firebase: Firebase,
  ) {
    super(backend, options);
    this.storage.get('token')
    .then((token) => {
      options.headers.set('Authorization', `Bearer ${token}`);
    });
  }

  request(url: string|Request, options?: RequestOptionsArgs): Observable<any> {
    return Observable.fromPromise(this.storage.get('token'))

    .flatMap((token) => {
      if (typeof url === 'string') { // meaning we have to add the token to the options, not in url
        if (!options) {
          // make option object
          options = { headers: new Headers() };
        }
        options.headers.set('Authorization', `Bearer ${token}`);
      } else {
        // add the token to the url object
        url.headers.set('Authorization', `Bearer ${token}`);
      }

      if (!!window['FirebasePlugin']) {
        this.trackAppView(url);
      }

      return super.request(url, options).catch(this.responseError(this));
    });
  }

  /**
   * Takes the url as the screen view name and sends it to Firebase Analytics
   * @param {any} url The url object to track for Firebase Analytics
   */
  trackAppView(url: any) {
    const viewUrl = url.url;
    this.firebase.logEvent('page_view', { content_type: 'page_view', item_id: viewUrl })
      .then((response) => console.log('Tracking with Firebase Analytics: ', response))
      .catch((error) => console.error('Error with Firebase Analytics event log: ', error));
  }

  private responseError (self: ExtendedHttpService) {
    // pass HttpService's own instance here as `self`
    return (res: Response) => {
      if (res.status === 401) {
        // if not authenticated
        // this.storage.remove('token');
      }
      return Observable.throw(res);
    };
  }
}
