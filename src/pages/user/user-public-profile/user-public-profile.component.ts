import { Component, OnInit } from '@angular/core';
import { CallNumber } from '@ionic-native/call-number';
import { SMS } from '@ionic-native/sms';
import { ViewController, ToastController, AlertController, NavParams } from 'ionic-angular';
import { AuthService } from '../../auth/auth.service';
import { User } from '../user';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';

const SERVICE_PROVIDER: string = 'service provider';
const MANAGER: string = 'horse manager';

@Component({
  selector: 'page-user-public-profile',
  templateUrl: 'user-public-profile.html',
})
export class UserPublicProfilePage implements OnInit {
  user: User;
  isLoading: boolean;
  isRefreshing: boolean;
  hideContactInfo: boolean;

  constructor(
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public navParams: NavParams,
    public authService: AuthService,
    public userService: UserService,
    public constants: ConstantsService,
    private callNumber: CallNumber,
    private sms: SMS,
  ) {}

  ngOnInit() {
    this.findUser();
    this.hideContactInfo = this.navParams.get('hideContactInfo');
  }

  /**
   * Retrieves user based on nav param user id and set to this.user
   * @param refresher
   */
  async findUser(refresher?: any) {
    try {
      this.isLoading = true;
      if (refresher) { this.isRefreshing = true; }

      const userId = this.navParams.get('userId');

      this.user = await this.userService.get(userId);

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

  /**
   * Prompt user to either call or text number
   * @param {string} phoneNumber Phone number to call/text
   */
  callOrText(phoneNumber: string) {
    const strippedNumber = phoneNumber.replace(/\D/g, '');

    const alert = this.alertCtrl.create({
      title: phoneNumber,
      buttons: [
        {
          text: 'Call',
          handler: () => {
            this.callNumber.callNumber(strippedNumber, false)
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
          text: 'Text',
          handler: () => {
            // Opens Default sms app for Android
            const options = {
              android: {
                intent: 'INTENT',
              },
            };

            this.sms.send(strippedNumber, '', options);
          },
        },
      ],
    });

    alert.present();
  }

  /**
   * Check if given user is a horse manager
   * @return boolean true/false
   */
  isManager(user: User) {
    return user.roles.includes(MANAGER);
  }

  /**
   * Check if given user is a service provider
   * @return boolean true/false
   */
  isServiceProvider(user: User) {
    return user.roles.includes(SERVICE_PROVIDER);
  }
}
