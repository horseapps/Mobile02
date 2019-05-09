import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewController, NavParams, Events } from 'ionic-angular';
import { CalendarComponent } from 'ionic2-calendar/calendar';

@Component({
  selector: 'page-calendar',
  templateUrl: 'calendar.html',
})

export class CalendarPage implements OnInit {
  /**
   * "calendarElement" reads and controls the HTML element in the view,
   * "calendar" deals with the object that sets the element's options
   * on initialization, including date and display format. In the template,
   * the calendar( object)'s values are read as the calendarElement is written.
   */
  @ViewChild('calendarElement') calendarElement: CalendarComponent;
  // Boilerplate calendar initialization settings
  calendar: any = {
    mode: 'month',
    // Calendar needs a currentDate to focus on when opened
    currentDate: this.setCurrentDate(),
    queryMode: 'remote',
    dateFormatter: {
      formatMonthViewDay: (date: Date) => {
        return date.getDate().toString();
      },
    },
  };
  currentMonth: string;
  currentYear: string;
  dateChangeFunction: Function;
  initDate: Date;
  selectedDate: Date;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public events: Events,
  ) {
    this.dateChangeFunction = this.navParams.get('dateChangeFunction');
    // Set the date provided by the 'parent' component
    this.initDate = new Date(this.cleanUpDate(this.navParams.get('selectedDate')));
  }

  ngOnInit() {
    // Initialize with the incoming date param, or today's date if invalid
    if (this.isValidDate(this.initDate)) {
      this.calendarElement.currentDate = this.initDate;
    } else {
      this.calendarElement.currentDate = this.calendar.currentDate;
    }
    this.setCurrentMonth();
    this.setCurrentYear();
    // Update the displayed month and year whenever the user selects a new date on the calendar
    this.events.subscribe('calendar:date-selected', () => {
      this.setCurrentMonth();
      this.setCurrentYear();
    });
  }

  setCurrentDate() {
    // Begin with the date that the user provided from the parent component
    let paramDateString = this.cleanUpDate(this.navParams.get('selectedDate'));

    // Correct for Chrome/Android behavior that overwrites the "year" in an invalid date as 2001
    // (1-2 month digits, a slash/dash, 1/2 more day digits, a slash/dash, 2 or more year digits)
    const pattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,}/;
    const match = pattern.exec(paramDateString);
    if (!match) {
      // If the user hasn't provided a full date, add current year to string before converting
      const year = new Date().getFullYear();
      paramDateString += `/${year}`;
    }

    const dateFromParams = new Date(paramDateString);
    if (this.isValidDate(dateFromParams) && this.navParams.get('selectedDate')) {
      // Use the provided date if it's valid
      return dateFromParams;
    }
    // Open the calendar on today's date if an invalid date (or nothing) was entered
    return new Date();
  }

  // Use parent-provided date change function (i.e. sending the date out to a form), close calendar
  setDateAndDismiss(date: Date) {
    this.dateChangeFunction(date);
    this.viewCtrl.dismiss();
  }

  // Send out a message whenever a new date is selected (and store the new value)
  captureDate(date: Date) {
    this.selectedDate = date;
    this.events.publish('calendar:date-selected');
  }

  // Standardizes date format with slash notation since "mixed-date/formats" return strange values
  cleanUpDate(date: any = '') {
    return date.replace(/-/g, '/');
  }

  // Checks whether the given date is a populated Date object
  isValidDate(date: any) {
    return date instanceof Date && !isNaN(date.valueOf());
  }

  // Updates calendar's displayed month by querying the HTML element's current selected date
  setCurrentMonth() {
    this.currentMonth = this.calendarElement.currentDate.toLocaleString('en-us', { month: 'long' });
  }

  // Updates calendar's displayed year by querying the HTML element's current selected date
  setCurrentYear() {
    this.currentYear = this.calendarElement.currentDate.toLocaleString('en-us', { year: 'numeric' });
  }

 // Toggles to next month (tied to right arrow icon in view)
  nextMonth() {
    this.calendarElement.currentDate = new Date(
      this.calendarElement.currentDate.setMonth(this.calendarElement.currentDate.getMonth() + 1),
    );
  }

  // Toggles to last month (tied to left arrow icon in view)
  previousMonth() {
    this.calendarElement.currentDate = new Date(
      this.calendarElement.currentDate.setMonth(this.calendarElement.currentDate.getMonth() - 1),
    );
  }
}
