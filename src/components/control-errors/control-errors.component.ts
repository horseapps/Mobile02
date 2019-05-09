import { Component, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ValidationService } from './validation.service';

@Component({
  selector: 'control-errors',
  template: `<div *ngIf="!!errorMessage()" class="form-control-error">{{errorMessage()}}</div>`,
})
export class ControlErrorsComponent {
  @Input() control: FormControl;
  @Input() submitAttempt: boolean;

  constructor(
    public validationService: ValidationService,
  ) {}

  errorMessage() {
    for (let propertyName in this.control.errors) {
      if (this.control.errors.hasOwnProperty(propertyName) && (this.control.touched || this.submitAttempt)) {
        return this.validationService.getValidatorErrorMessage(propertyName, this.control.errors[propertyName]);
      }
    }

    return null;
  }
}
