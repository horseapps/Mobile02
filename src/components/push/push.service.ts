import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { OneSignal } from '@ionic-native/onesignal';
import { Platform, ToastController } from 'ionic-angular';
import { ConstantsService } from '../../providers/constants.service';

// Import RxJs required methods
import 'rxjs/add/operator/toPromise';

@Injectable()
export class PushService {

  constructor(
    private http: Http,
    private oneSignal: OneSignal,
    public constantsService: ConstantsService,
    private toastCtrl: ToastController,
    public platform: Platform,
  ) {}

  initOneSignal() {
    if (this.platform.is('cordova')) {
      this.oneSignal.startInit(this.constantsService.ONESIGNAL_APP_ID, this.constantsService.GOOGLE_PROJECT_NUMBER);

      this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.InAppAlert);

      this.oneSignal.handleNotificationOpened();

      this.oneSignal.endInit();
    } else {
      console.info('Cordova is unavailable');
    }
  }

  addDevice() {
    this.oneSignal.getIds()
      .then((ids) => {
        const userId = ids.userId;

        return this.http.post(`${this.constantsService.API_BASE_URL}/users/addDevice`, { deviceId: userId })
        .toPromise()
        .catch((err) => {
          const message = err.json().message || 'There was an error';
          const toast = this.toastCtrl.create({
            message: message,
            duration: 3000,
            cssClass: 'toast-danger',
          });
          toast.present();
        });
      })
      .catch((err) => {
        const message = err;
        const toast = this.toastCtrl.create({
          message: message,
          duration: 3000,
          cssClass: 'toast-danger',
        });
        toast.present();
      });
  }
}
