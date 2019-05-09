import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ViewController, Platform, ToastController } from 'ionic-angular';
import { SocialSharing } from '@ionic-native/social-sharing';
import { FormBuilder } from '@angular/forms';
import { UserService } from './../../pages/user/user.service';
import { HorseService } from './../../pages/horse/horse.service';
import { AuthService } from '../../pages/auth/auth.service';
import { ConstantsService } from '../../providers/constants.service';
import { Keyboard } from '@ionic-native/keyboard';

@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})

export class SearchPage {
  searchItems: any[];
  searchTerm: string;
  searchPlaceholder: string;
  serviceType: string;
  role: string;
  selectFunction: Function;
  index: number;
  excludeIds: string[];
  isSearching: boolean;
  @ViewChild('searchInput') searchInput: any;

  constructor (
    private formBuilder: FormBuilder,
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public userService: UserService,
    public horseService: HorseService,
    private socialSharing: SocialSharing,
    public platform: Platform,
    private authService: AuthService,
    public constants: ConstantsService,
    private toastCtrl: ToastController,
    public keyboard: Keyboard,
  ) {
    this.searchItems = [];
    this.searchTerm = '';
    this.searchPlaceholder = this.navParams.get('searchPlaceholder');
    this.serviceType = this.navParams.get('serviceType');
    this.selectFunction = this.navParams.get('selectFunction');
    this.role = this.navParams.get('role');

    if (this.navParams.get('index') >= 0) {
      this.index = this.navParams.get('index');
    }

    if (this.navParams.get('excludeIds')) {
      this.excludeIds = this.navParams.get('excludeIds');
    }
  }

  /**
   * Force the focus on the search input
   * Add a timeout to avoid a UI glitch when opening the keyboard
   */
  ionViewDidEnter() {
    if (this.platform.is('cordova')) {
      setTimeout(
        () => {
          if (this.platform.is('ios')) {
            this.keyboard.disableScroll(true);
          }
          this.searchInput.setFocus();
        },
        150,
      );
    }
  }

  /**
   * Keyword search users
   */
  async search() {
    if (this.searchTerm.length) {
      this.isSearching = true;

      const searchParams: {
        searchTerm: string,
        role: string,
        excludeIds?: string[],
      } = {
        searchTerm: this.searchTerm,
        role: this.role,
      };

      // If we are replacing a user, we do not want them sent back in the results
      if (this.excludeIds) {
        searchParams.excludeIds = this.excludeIds;
      }

      const searchResults = await this[this.serviceType].query(searchParams);

      this.searchItems = searchResults;
      this.isSearching = false;
    } else {
      this.searchItems = [];
    }
  }

  /**
   * Update the form with the selected value and clear the search
   * @param {any} item [description]
   */
  chooseItem(item: any) {
    if (this.index >= 0) {
      this.selectFunction(item, this.index);
    } else {
      this.selectFunction(item);
    }

    this.viewCtrl.dismiss();
  }

  /**
   * Generate the invite message content. Show appropriate app store link based on platform
   */
  createMessage() {
    const inviteeName = this.authService.currentUser.name;
    let url;

    if (this.platform.is('ios')) {
      url = this.constants.APP_STORE_LINK;
    } else if (this.platform.is('android')) {
      url = this.constants.PLAY_STORE_LINK;
    }

    return `${inviteeName} wants you to join HorseLinc! You can download the app at ${url}`;
  }

  /**
   * Share HorseLinc app link via email
   */
  emailInvite() {
    if (this.platform.is('cordova')) {
      const message = this.createMessage();
      const subject = `You're Invited To HorseLinc!`;

      this.socialSharing.shareViaEmail(message, subject, null, null, null, null)
        .then(() => {
          // Drop, then restore focus to search bar once the user leaves native email
          this.searchInput.setBlur();
          setTimeout(
            () => {
              this.keyboard.disableScroll(true);
              this.searchInput.setFocus();
            },
            150,
          );
        })
        .catch((error) => {
          const errorMessage = error || 'There was an error';
          this.handleError(errorMessage);
        });
    } else {
      this.handleError('Cordova is unavailable');
    }
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
