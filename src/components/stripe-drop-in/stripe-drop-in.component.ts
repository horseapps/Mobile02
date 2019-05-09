import { Component, Input, AfterViewInit } from '@angular/core';
import { NavController, AlertController, ToastController, ModalController } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { ConstantsService } from '../../providers/constants.service';
import { AuthService } from '../../pages/auth/auth.service';
import { UserService } from '../../pages/user/user.service';
declare var Stripe: any;

@Component({
  selector: 'stripe-drop-in-payment',
  templateUrl: 'stripe-drop-in.html',
})

export class StripeDropInComponent implements AfterViewInit {
  expDate: string;
  isSubmitting: boolean;
  @Input('fromAcctSetup') fromAcctSetup: boolean;
  @Input('buttonText') buttonText: string;
  @Input() submitFunction: Function;

  constructor (
    public navCtrl: NavController,
    public constants: ConstantsService,
    public authService: AuthService,
    public userService: UserService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private keyboard: Keyboard,
    private modalCtrl: ModalController,
  ) {
    if (this.authService.currentUser &&
      this.authService.currentUser.stripeExpMonth &&
      this.authService.currentUser.stripeExpYear) {
      this.expDate = `${this.authService.currentUser.stripeExpMonth}/${this.authService.currentUser.stripeExpYear}`;
    }
  }

  ngAfterViewInit() {
    this.loadStripe()
      .then(() => {
        this.stripeSetup();
      })
      .catch((error) => {
        const message = error.json().message || 'There was an error.';
        const toast = this.toastCtrl.create({
          cssClass: 'toast-danger',
          message: message,
          duration: 3000,
          position: 'bottom',
          showCloseButton: true,
        });
        toast.present();
      });
  }

  loadStripe(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject(new URIError('Stripe did not load correctly'));
      document.head.appendChild(script);
    });
  }

  /**
   * Setup Stripe Elements
   */
  stripeSetup() {
    // Configuration
    const stripe = Stripe(this.constants.STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    const style = {
      base: {
        color: '#000',
        lineHeight: '40px',
        fontWeight: 200,
        fontSize: '16px',
        '::placeholder': {
          color: '#7b7b81',
        },
      },
    };

    // Create an instance of the card Element
    const card = elements.create('card', { style: style });

    // Add an instance of the card Element into the `card-element` <div>
    card.mount('#card-element');

    // Get token from Stripe
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      stripe.createToken(card).then((result) => {
        if (result.error) {
          // Inform the user if there was an error
          const errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
        } else {
          this.isSubmitting = true;

          // Send the token to our server
          this.userService.submitPaymentToken(result.token)
            .then((response) => {
              // Call the function passed in as an input
              if (this.submitFunction) {
                this.submitFunction();
              }
            })
            .catch((error) => {
              const message = error.json().message || 'There was an error.';
              const toast = this.toastCtrl.create({
                cssClass: 'toast-danger',
                message: message,
                duration: 3000,
                position: 'bottom',
                showCloseButton: true,
              });
              toast.present();
            })
            .then(() => {
              this.isSubmitting = false;
            });
        }
      });
    });
  }
}
