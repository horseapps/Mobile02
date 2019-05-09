import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { ConstantsService } from './constants.service';

@Injectable()
export class UtilityService {

  constructor(
    private toastCtrl: ToastController,
    private constants: ConstantsService,
  ) {}

  /**
   * Utility function to display an error message toast;
   * @param msg Optional error message to display
   */
  errorToast(msg?: string, error?: any): void {
    const message = msg ? msg : 'Whoops! There was an error';
    this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: 'toast-danger',
    }).present();
  }

  /**
   * Utility function to display an success message toast;
   * @param msg Optional success message to display
   */
  successToast(msg?: string): void {
    const message = msg ? msg : 'Success!';
    this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: 'toast-success',
    }).present();
  }
}
