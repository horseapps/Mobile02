import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, NavParams, Events, ToastController,
  AlertController, ModalController, Platform } from 'ionic-angular';
import { EmailComposer } from '@ionic-native/email-composer';
import { CallNumber } from '@ionic-native/call-number';
import { Storage } from '@ionic/storage';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AuthService } from '../../auth/auth.service';
import { TermsServicePage } from '../../legal/terms-service/terms-service.component';
import { PrivacyPolicyPage } from '../../legal/privacy-policy/privacy-policy.component';
import { UserEditPaymentInfoPage } from '../user-edit-payment-info/user-edit-payment-info.component';
import { UserNewServiceProviderPage } from '../user-new-service-provider/user-new-service-provider.component';
import { UserEditPage } from '../user-edit/user-edit.component';
import { NotificationListPage } from '../../notification/notification-list/notification-list.component';
import { User } from '../user';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';

@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html',
})
export class UserProfilePage implements OnInit {
  user: User;
  isLoading: boolean;
  isRefreshing: boolean;

  constructor(
    public storage: Storage,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    private events: Events,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    public authService: AuthService,
    public userService: UserService,
    public emailComposer: EmailComposer,
    public constants: ConstantsService,
    public platform: Platform,
    private inAppBrowser: InAppBrowser,
    private callNumber: CallNumber,
  ) {
    // Refresh profile data after a new user logs in
    this.events.subscribe('user:logged-in', () => {
      this.findMe();
    });

    // Update user on platform resume to see if user has been approved by Stripe
    this.platform.resume.subscribe(() => {
      this.findMe();
    });

    // Refresh profile data after a user adds a trusted service provider
    this.events.subscribe('provider:created', () => {
      this.findMe();
    });
  }

  async ngOnInit() {
    const token = await this.storage.get('token');
    if (token) {
      this.findMe();
    }
    await this.prepareServiceProviders();
  }

  /**
   * Retrieves current user and sets to authService.currentUser
   * @param refresher
   */
  async findMe(refresher?: any) {
    try {
      this.isLoading = true;
      if (refresher) { this.isRefreshing = true; }
      const me = await this.authService.getCurrentUser();
      this.authService.currentUser = me;
      this.userService.user = me;

      const groupedProviders = await this.prepareServiceProviders();
      this.userService.groupedServiceProviders = groupedProviders;

      if (refresher) { refresher.complete(); }

      this.isRefreshing = false;
      this.isLoading = false;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.userService.handleError(message);
      this.isRefreshing = false;
      this.isLoading = false;
    }
  }

  openTermsModal() {
    const termsModal = this.modalCtrl.create(TermsServicePage, null, { enableBackdropDismiss: false });
    termsModal.present();
  }

  openPrivacyPolicyModal() {
    const privacyPolicyModal = this.modalCtrl.create(PrivacyPolicyPage, null, { enableBackdropDismiss: false });
    privacyPolicyModal.present();
  }

  async prepareServiceProviders() {
    try {
      const groupedProviders = await this.userService.getGroupedServiceProviders();
      return groupedProviders;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.userService.handleError(message);
    }
  }

  async deleteServiceProvider(providerInfo: { _id: any }) {
    let confirm = this.alertCtrl.create({
      title: 'Really Delete?',
      message: 'Are you sure you want to delete this service provider?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.userService.deleteServiceProvider(providerInfo._id)
              .then((response) => {
                this.refreshProvidersAfterDelete(response);
                this.successToast('The service provider has been successfully deleted.');
              })
              .catch((error) => {
                const message = error.json().message || 'There was an error.';
                this.userService.handleError(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  refreshProvidersAfterDelete(remainingGroupedProviders: any) {
    this.userService.groupedServiceProviders = remainingGroupedProviders;
  }

  successToast(message: string) {
    const toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: 'toast-success',
    });

    toast.present();
  }

  /**
   * Based on user role - go to edit payment modal or external Stripe dashboard
   */
  editPaymentInformation() {
    if (this.authService.isManager()) {
      const editPaymentModal = this.modalCtrl.create(UserEditPaymentInfoPage, null, { enableBackdropDismiss: false });
      editPaymentModal.present();
    } else if (this.authService.isServiceProvider()) {
      if (this.authService.hasPaymentSetup()) {
        this.goToStripeDashboard();
      } else {
        this.connectStripe();
      }
    }
  }

  goToProfileEdit() {
    const editProfileModal = this.modalCtrl.create(UserEditPage, null, { enableBackdropDismiss: false });
    editProfileModal.present();
  }

  /**
   * Get and open a temporary link to Express dashboard from our server
   */
  goToStripeDashboard() {
    this.userService.getStripeDashboardUrl()
      .then((response) => {
        if (this.platform.is('android')) {
          window.open(response.link.url, '_system');
        } else {
          const browser = this.inAppBrowser.create(response.link.url, '_system');
          browser.show();
        }
      })
      .catch((error) => {
        const message = error.json().message || 'There was an error.';
        const toast = this.toastCtrl.create({
          message: message,
          duration: 3000,
          position: 'top',
          showCloseButton: true,
        });
        toast.present();
      });
  }

  goToAppLog() {
    const notificationListModal = this.modalCtrl.create(NotificationListPage, null, { enableBackdropDismiss: false });
    notificationListModal.present();
  }

  /**
   * Open email composer to send email
   */
  sendEmail() {
    let emailOptions = {
      to: this.constants.ADMIN_EMAIL,
      subject: 'HorseLinc Mobile',
    };

    this.emailComposer.open(emailOptions)
      .catch(() => {
        const message = 'There was an error opening the email composer.';
        const toast = this.toastCtrl.create({
          message: message,
          duration: 3000,
          cssClass: 'toast-danger',
        });
        toast.present();
      });
  }

  /**
   * Allow user to choose to either call or email HorseLinc
   */
  openContactAlert() {
    const alert = this.alertCtrl.create({
      title: 'Contact HorseLinc',
      buttons: [
        {
          text: 'Call',
          handler: () => {
            this.callNumber.callNumber(this.constants.ADMIN_PHONE, false)
              .catch(() => {
                const toast = this.toastCtrl.create({
                  message: 'There was an error opening the dialer.',
                  duration: 3000,
                  cssClass: 'toast-danger',
                });
                toast.present();
              });
          },
        },
        {
          text: 'Email',
          handler: () => {
            this.sendEmail();
          },
        },
      ],
    });

    alert.present();
  }

  logout() {
    this.authService.logout();
  }

  /**
   * Connect with Stripe by going to their OAuth authorization url
   */
  connectStripe() {
    let stripeOAuthLink = 'https://connect.stripe.com/express/oauth/authorize?redirect_uri=';
    stripeOAuthLink += this.constants.STRIPE_REDIRECT_URI;
    stripeOAuthLink += `&client_id=${this.constants.STRIPE_CLIENT_ID}&state=${this.authService.currentUser._id}`;

    if (this.platform.is('android')) {
      window.open(stripeOAuthLink, '_system');
    } else {
      const browser = this.inAppBrowser.create(stripeOAuthLink, '_system');
      browser.show();
    }
  }

  goToNewServiceProvider() {
    const newServiceProviderModal = this.modalCtrl.create(UserNewServiceProviderPage, null, { enableBackdropDismiss: false });
    newServiceProviderModal.present();
  }
}
