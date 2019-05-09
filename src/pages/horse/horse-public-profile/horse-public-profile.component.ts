import { Component, OnInit } from '@angular/core';
import { ViewController, ToastController, ModalController, NavParams } from 'ionic-angular';
import { UserPublicProfilePage } from '../../user/user-public-profile/user-public-profile.component';
import { AuthService } from '../../auth/auth.service';
import { Horse } from '../horse';
import { User } from '../../user/user';
import { HorseService } from '../horse.service';
import { UserService } from '../../user/user.service';
import { ConstantsService } from '../../../providers/constants.service';

@Component({
  selector: 'page-horse-public-profile',
  templateUrl: 'horse-public-profile.html',
})
export class HorsePublicProfilePage implements OnInit {
  horse: Horse;
  isLoading: boolean;
  isRefreshing: boolean;

  constructor(
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    public navParams: NavParams,
    public authService: AuthService,
    public horseService: HorseService,
    public userService: UserService,
    public constants: ConstantsService,
  ) {}

  ngOnInit() {
    this.findHorse();
  }

  /**
   * Retrieves horse based on nav param horse id and set to this.horse
   * @param refresher
   */
  async findHorse(refresher?: any) {
    try {
      this.isLoading = true;
      if (refresher) { this.isRefreshing = true; }

      const horseId = this.navParams.get('horseId');

      this.horse = await this.horseService.get(horseId);

      if (refresher) { refresher.complete(); }
      this.isRefreshing = false;
      this.isLoading = false;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.horseService.handleError(message);
      this.isRefreshing = false;
      this.isLoading = false;
    }
  }

  /**
   * Go to public profile for a user
   * @param {User}       user The user object
   * @param {boolean = true}        hideInfo True if contact info should be hidden
   */
  goToPublicProfile(user: User, hideInfo: boolean = true) {
    const data = {
      userId: user._id,
      hideContactInfo: hideInfo,
    };

    const publicProfileModal = this.modalCtrl.create(UserPublicProfilePage, data, { enableBackdropDismiss: false });
    publicProfileModal.present();
  }
}
