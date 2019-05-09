import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Content, ModalController, NavController, ViewController, Events, ToastController, NavParams, Platform } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { UserService } from '../../user/user.service';
import { TermsServicePage } from '../../legal/terms-service/terms-service.component';
import { PrivacyPolicyPage } from '../../legal/privacy-policy/privacy-policy.component';
import { ValidationService } from '../../../components/control-errors/validation.service';
import { ConstantsService } from '../../../providers/constants.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'page-account-setup-provider',
  templateUrl: 'account-setup-provider.html',
})

export class AccountSetupProviderPage implements OnInit {
  isSubmitting: boolean;
  submitAttempt: boolean;
  form: FormGroup;
  phoneMask: any;
  roleViewCtrl: any;
  @ViewChild('content') content: Content;

  constructor(
    private modalCtrl: ModalController,
    public navCtrl: NavController,
    public formBuilder: FormBuilder,
    private viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private userService: UserService,
    private validationService: ValidationService,
    public constants: ConstantsService,
    private authService: AuthService,
    public navParams: NavParams,
    private platform: Platform,
    private inAppBrowser: InAppBrowser,
    public events: Events,
  ) {

    this.phoneMask = [/[1-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      roles: [['user', 'service provider'], [Validators.required]],
      accountSetupComplete: [true, [Validators.required]],
      avatar: [''],
      services: this.formBuilder.array([
          this.initService(),
      ]),
    });

    // Update user on platform resume to see if user has been approved by Stripe
    this.platform.resume.subscribe(() => {
      this.updateStripeStatus();
    });
  }

  /**
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   */
  scrollToServiceInput() {
    if (this.platform.is('cordova')) {
      const id = 'service-input-section';
      let yOffset = document.getElementById(id).offsetTop;
      this.content.scrollTo(0, yOffset, 1000);
    }
  }

  updateStripeStatus(refresher?: any) {
    this.authService.getCurrentUser()
      .then((response) => {
        if (response.stripeAccountApproved) {
          this.authService.currentUser.stripeAccountApproved = true;
        }

        if (refresher) {
          refresher.complete();
        }
      });
  }

  /**
   * Initialize services array with a blank service
   */
  initService() {
    // initialize our services
    return this.formBuilder.group({
      service: ['', [Validators.required]],
      rate: ['', [this.validationService.minimumServiceAmount]],
    });
  }

  /**
   * Add service to form array group
   */
  addService() {
    // Add service to the list if previous services are valid
    if (this.form.controls.services.valid) {
      const control = <FormArray>this.form.controls.services;
      control.push(this.initService());
    }
  }

  /**
   * Remove service from form array group
   * @param {number} i index of service in form array
   */
  removeService(i: number) {
    // Remove service from the list
    const control = <FormArray>this.form.controls.services;
    control.removeAt(i);
  }

  ngOnInit() {
    this.roleViewCtrl = this.navParams.get('viewCtrl');
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

  submit() {
    this.submitAttempt = true;

    // There is an open issue with text-mask module https://github.com/text-mask/text-mask/issues/294
    // Sometimes an extra character is being added that we need to trim
    if (this.form.value.phone && this.form.value.phone.length > 12) {
      this.form.value.phone = this.form.value.phone.slice(0, 12);
    }

    // Add avatar if there is one
    if (this.authService.currentUser.avatar) {
      this.form.value.avatar = this.authService.currentUser.avatar;
    }

    if (this.form.valid) {
      this.isSubmitting = true;

      // Update current user
      this.userService.updateMe(this.form.value)
        .then((response) => {
          this.authService.currentUser = response;
          this.events.publish('user:account-setup-complete');

          const toast = this.toastCtrl.create({
            cssClass: 'toast-success',
            message: 'Your account has been updated!',
            duration: 3000,
            position: 'bottom',
            showCloseButton: true,
          });
          toast.present()
            .then(() => {
              this.roleViewCtrl.dismiss();
              this.navCtrl.pop();
              this.isSubmitting = false;
            });
        })
        .catch((err) => {
          this.isSubmitting = false;
          this.validationService.buildServerErrors(this.form, err.json());
        });
      }
  }

  openTermsModal() {
    const termsModal = this.modalCtrl.create(TermsServicePage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
    termsModal.present();
  }

  openPrivacyPolicyModal() {
    const privacyPolicyModal = this.modalCtrl.create(
      PrivacyPolicyPage,
      null,
      { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' },
    );
    privacyPolicyModal.present();
  }
}
