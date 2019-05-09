import { Component, OnInit } from '@angular/core';
import { ToastController, ViewController } from 'ionic-angular';
import { LegalService } from '../legal.service';

@Component({
  selector: 'page-terms-service',
  templateUrl: 'terms-service.html',
})

export class TermsServicePage implements OnInit {
  terms: string;
  isLoading: boolean;

  constructor(
    public legalService: LegalService,
    public viewCtrl: ViewController,
    public toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.getTermsOfService();
  }

  async getTermsOfService() {
    this.isLoading = true;
    try {
      this.terms = await this.legalService.getTerms();
      this.isLoading = false;
    } catch (err) {
      const message = err.json().message || 'There was an error.';
      this.handleError(message);
      this.isLoading = false;
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
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
