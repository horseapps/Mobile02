import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, NavController, ViewController, Content, ToastController, NavParams, Events, Platform } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { UserService } from '../../user/user.service';
import { ValidationService } from '../../../components/control-errors/validation.service';
import { Autocomplete } from '../../../components/autocomplete/autocomplete.component';
import { ConstantsService } from '../../../providers/constants.service';
import { AuthService } from '../../auth/auth.service';
import { TermsServicePage } from '../../legal/terms-service/terms-service.component';
import { PrivacyPolicyPage } from '../../legal/privacy-policy/privacy-policy.component';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'page-account-setup-manager',
  templateUrl: 'account-setup-manager.html',
})

export class AccountSetupManagerPage implements OnInit, OnDestroy {
  submitFunction: Function;
  submitAttempt: boolean;
  form: FormGroup;
  phoneMask: any;
  roleViewCtrl: any;
  addPadding: boolean = false;
  inputFocused: boolean = false;
  onShowSubscription: Subscription;
  onHideSubscription: Subscription;
  @ViewChild('focusInput') focusInput: any;
  @ViewChild('content') content: Content;
  @ViewChild(Autocomplete) autocomplete: Autocomplete;

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
    public events: Events,
    private keyboard: Keyboard,
    private platform: Platform,
    private ref: ChangeDetectorRef,
  ) {

    this.phoneMask = [/[1-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      barn: [''],
      phone: ['', [Validators.required]],
      location: [''],
      roles: [['user', 'horse manager'], [Validators.required]],
      accountSetupComplete: [true, [Validators.required]],
      avatar: [''],
    });
  }

  /**
   * Scroll to a given element
   * @param {string} element The element to scroll to - should be an id
   */
  scrollTo(element: string) {
    let yOffset = document.getElementById(element).offsetTop;
    this.content.scrollTo(0, yOffset, 1000);
  }

  // Unsubscribe
  ngOnDestroy() {
    this.ref.detach();
    if (this.onShowSubscription) {
      this.onShowSubscription.unsubscribe();
    }
    if (this.onHideSubscription) {
      this.onHideSubscription.unsubscribe();
    }
  }

  // The Stripe keyboard does not close when navigating between different views
  // Force close by focusing on a different input
  ionViewWillLeave() {
    this.focusInput.setFocus();
  }

  ngOnInit() {
    // Bind 'this' since the submit function is a callback
    this.submitFunction = this.submit.bind(this);

    this.roleViewCtrl = this.navParams.get('viewCtrl');

    if (this.platform.is('cordova')) {
      this.onShowSubscription = this.keyboard.onKeyboardShow().subscribe((e) => this.onShow(e));
      this.onHideSubscription = this.keyboard.onKeyboardHide().subscribe(() => this.onHide());
    }
  }

  /**
   * When the keyboard is shown and only the Stripe input is focused, add padding to
   * Scroll content so the keyboard does not cover up form input - this is a bug with Stripe
   * Call change detection to update variable in html template
   */
  onShow(e: any) {
    if (!this.inputFocused && !this.autocomplete.focus) {
      this.addPadding = true;
      this.ref.detectChanges();
      this.scrollTo('stripe-el');
    }
  }

  /**
   * When the keyboard is hidden, remove extra padding
   * Call change detection to update variable in html template
   */
  onHide() {
    this.addPadding = false;
    this.ref.detectChanges();
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
            });
        })
        .catch((err) => {
          this.validationService.buildServerErrors(this.form, err.json());
        });
      } else {
        const toast = this.toastCtrl.create({
          cssClass: 'toast-danger',
          message: 'Please fill out all required fields.',
          duration: 3000,
          position: 'bottom',
          showCloseButton: true,
        });
        toast.present();
      }
  }

  openTermsModal() {
    const termsModal = this.modalCtrl.create(TermsServicePage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
    termsModal.present();
  }

  openPrivacyPolicyModal() {
    const privacyPolicyModal = this.modalCtrl.create(PrivacyPolicyPage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
    privacyPolicyModal.present();
  }
}
