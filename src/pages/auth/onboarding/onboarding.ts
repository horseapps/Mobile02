import { Component } from '@angular/core';
import { ModalController, ViewController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { LoginPage } from '../login/login';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html',
})

export class OnboardingPage {
  showSkip: boolean = true;
  finalButtonText: string = 'Continue';
  slides: { title: string, description: string, image: string }[] = [
    {
      title: '"Linc"ing horses to the services they need by automating:',
      description: '<ul>' +
                      '<li>Service Requests from the Horse Managers</li>' +
                      '<li>Service Provider Scheduling</li>' +
                      '<li>Invoicing</li>' +
                      '<li>Payments</li>' +
                    '</ul>',
      image: 'assets/images/onboarding-slide-1.png',
    },
    {
      title: 'Horse Managers',
      description: '<br>Set up horse profiles to easily manage services and payments associated with each horse.</br>' +
      '<br>Request services for the horses that will be sent directly to the service providers\' schedules.</br>' +
      '<br>Confirm automated invoices once services are completed to process payments from the assigned horse owner\'s profile.</br>',
      image: 'assets/images/onboarding-slide-2.png',
    },
    {
      title: 'Service Providers',
      description: '<br>Set up your services and rates in your personalized profile. ' +
        'Manage scheduled service requests from your schedule screen.</br>' +
        '<br>Mark services complete to automatically create an invoice back to the horse managers. ' +
        'Receive confirmation of automated payment once horse managers confirm the services are completed.</br>',
      image: 'assets/images/onboarding-slide-3.png',
    },
  ];

  constructor(
    public modalCtrl: ModalController,
    public viewCtrl: ViewController,
    public storage: Storage,
  ) { }

  completeOnboarding() {
    this.storage.set('hasSeenOnboarding', true);
    const loginModal = this.modalCtrl.create(LoginPage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
    loginModal.present()
      .then(() => {
        this.viewCtrl.dismiss();
      });
  }
}
