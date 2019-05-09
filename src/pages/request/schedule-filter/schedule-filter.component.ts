import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { RequestService } from './../request.service';
import { ConstantsService } from '../../../providers/constants.service';
import moment from 'moment';

@Component({
  selector: 'page-schedule-filter',
  templateUrl: 'schedule-filter.html',
})

export class ScheduleFilterPage {
  isLoading: boolean;
  sortOptions: any[];
  filterSort: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';
  minYear: any = moment().startOf('year').subtract(1, 'years').format();
  maxYear: any = moment().startOf('year').add(2, 'years').endOf('year').format();

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public constants: ConstantsService,
    public requestService: RequestService,
    public viewCtrl: ViewController,
  ) {
    this.filterSort = navParams.get('filterSort');
    this.filterStartDate = navParams.get('filterStartDate');
    this.filterEndDate = navParams.get('filterEndDate');

    this.sortOptions = [
      { name: 'barnName', formattedName: 'Horse Barn Name (ascending)' },
      { name: '-barnName', formattedName: 'Horse Barn Name (descending)' },
      { name: 'showName', formattedName: 'Horse Show Name (ascending)' },
      { name: '-showName', formattedName: 'Horse Show Name (descending)' },
    ];
  }

  dismiss() {
    const data: any = {};

    if (this.filterSort !== 'None') {
      data.sort = this.filterSort;
    }

    if (this.filterStartDate !== 'None') {
      data.startDate = this.filterStartDate;
    }

    if (this.filterEndDate !== 'None') {
      data.endDate = this.filterEndDate;
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
}
