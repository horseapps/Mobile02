import { Component, Input, OnInit } from '@angular/core';
import { ViewController, AlertController, NavParams } from 'ionic-angular';
import { Horse } from '../horse';
import { HorseService } from '../horse.service';
import { AuthService } from '../../auth/auth.service';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User } from './../../user/user';
import { UserService } from './../../user/user.service';

@Component({
  selector: 'page-horse-private-note-form',
  templateUrl: 'horse-private-note-form.html',
})

export class HorsePrivateNoteFormPage implements OnInit {
  submitFunction: Function;
  form: FormGroup;
  @Input() horse: Horse;
  user: User;

  constructor(
    public horseService: HorseService,
    public userService: UserService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private alertCtrl: AlertController,
    public formBuilder: FormBuilder,
    public navParams: NavParams,
    public authService: AuthService,
  ) {
    this.horse = this.horseService.horse;
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.form = this.formBuilder.group({
      privateNote: [''],
    });
    this.populateNote();
  }

  populateNote() {
    if (!this.user.privateNotes) {
      this.user.privateNotes = [];
    }

    if (this.horse) {
      const foundNote = this.user.privateNotes.find((noteObj) => {
        return noteObj._horse === this.horse._id;
      });

      if (foundNote) {
        this.form.patchValue({
          privateNote: foundNote.note,
        });
      }
    }
  }

  // Do not allow user to add more than 300 characters to the private note
  // Android does not respect the maxlength html property so we add a check here
  maxLength() {
    if (this.form.controls.privateNote.value >= 300) {
      this.form.patchValue({
        privateNote: this.form.controls.privateNote.value.substring(0, 300),
      });
    }
  }

  async updatePrivateNotes() {
    let notesChanged = false;
    this.user.privateNotes.forEach(async (noteObj) => {
      if (noteObj._horse === this.horse._id) {
        noteObj.note = this.form.controls.privateNote.value;
        notesChanged = true;
      }
    });
    if (!notesChanged) {
      this.user.privateNotes.push({ _horse: this.horse._id, note: this.form.controls.privateNote.value });
    }
    await this.userService.updateMe(this.user);
    this.viewCtrl.dismiss();
  }
  /**
   * If form is dirty, confirm that user wants to leave before dismissing view
   */
  dismiss() {
    if (this.formDirty()) {
      let confirm = this.alertCtrl.create({
        title: 'Go Back?',
        message: 'Are you sure you want to go back? All your changes will be lost.',
        buttons: [
          { text: 'Cancel' },
          {
            text: 'OK',
            handler: () => {
              this.viewCtrl.dismiss();
            },
          },
        ],
      });

      confirm.present();
    } else {
      this.viewCtrl.dismiss();
    }
  }

  // See if the form is dirty
  formDirty() {
    return this.form.dirty ||
      this.form.value.privateNote;
  }

}
