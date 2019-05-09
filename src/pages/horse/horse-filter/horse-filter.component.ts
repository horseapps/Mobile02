import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { HorseService } from './../horse.service';
import { UserService } from './../../user/user.service';
import { User } from '../../user/user';
import { ConstantsService } from '../../../providers/constants.service';

@Component({
  selector: 'page-horse-filter',
  templateUrl: 'horse-filter.html',
})

export class HorseFilterPage implements OnInit {
  isLoading: boolean;
  sortOptions: any[];
  horseManagers: User[] = [];
  filterSort: string = '';
  filterOwner: any = {};
  filterTrainer: any = {};

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public constants: ConstantsService,
    public horseService: HorseService,
    public userService: UserService,
    public viewCtrl: ViewController,
  ) {
    this.filterSort = navParams.get('filterSort');
    this.filterOwner = navParams.get('filterOwner');
    this.filterTrainer = navParams.get('filterTrainer');

    this.sortOptions = [
      { name: 'barnName', formattedName: 'Barn Name (ascending)' },
      { name: '-barnName', formattedName: 'Barn Name (descending)' },
      { name: 'createdAt', formattedName: 'Creation Date (ascending)' },
      { name: '-createdAt', formattedName: 'Creation Date (descending)' },
    ];
  }

  ngOnInit(): void {
    this.getHorseManagers();
  }

  dismiss() {
    const data: any = {};

    if (this.filterSort !== 'None') {
      data.sort = this.filterSort;
    }

    if (this.filterOwner !== 'None') {
      data.owner = this.filterOwner;
    }

    if (this.filterTrainer !== 'None') {
      data.trainer = this.filterTrainer;
    }

    this.viewCtrl.dismiss(data);
  }

  saveFilter() {
    this.dismiss();
  }

  clearFilter() {
    const data = {};
    this.viewCtrl.dismiss(data);
  }

  /**
   * Load horse managers from the server
   */
  async getHorseManagers() {
    try {
      this.isLoading = true;
      const users = await this.userService.query({ limit: 100, limitByHorse: true });
      this.horseManagers = users;
      this.isLoading = false;
    } catch (err) {
      this.horseManagers = [];
      this.isLoading = false;
    }
  }
}
