import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Injectable()
export class ValidationService {

  /**
   * The server returns mongoose formatted errors (object with property names and errors)
   * Get the property name from the error and match it to a control
   * @param {FormGroup} form The form to add errors
   * @param {object} errors Error object from server
   */
  buildServerErrors(form: FormGroup, errors: any) {
    const serverErrors = errors.errors;
    for (let error in serverErrors) {
      if (serverErrors.hasOwnProperty(error)) {
        form.controls[error].setErrors({ server: serverErrors[error].message });
      }
    }
  }

  getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
    const validationMessages: {} = {
      'required': 'Required',
      'invalidCreditCard': 'Is invalid credit card number',
      'invalidEmailAddress': 'Invalid email address',
      'invalidPassword': 'Invalid password. Password must be at least 6 characters long, and contain a number.',
      'minlength': `Minimum length ${validatorValue.requiredLength}`,
      'invalidServiceRate': 'Rate must be at least $1.00 - numerical characters only.',
      'invalidMaxLength50': 'Must be 50 characters or less.',
      'validHeight': 'Must be a valid decimal number.',
      'invalidWholeNumber': 'Must be a whole number.',
      'server': `${validatorValue}`,
    };

    return validationMessages[validatorName];
  }

  creditCardValidator(control: FormControl) {
    // Visa, MasterCard, American Express, Diners Club, Discover, JCB
    if (control.value && control.value.match(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/)) {
      return null;
    } else {
      return { 'invalidCreditCard': true };
    }
  }

  emailValidator(control: FormControl) {
    // RFC 2822 compliant regex
    if (control.value && control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
      return null;
    } else {
      return { 'invalidEmailAddress': true };
    }
  }

  passwordValidator(control: FormControl) {
    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    if (control.value && control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
      return null;
    } else {
      return { 'invalidPassword': true };
    }
  }

  minimumServiceAmount(control: FormControl) {
    if (control.value && control.value >= 1) {
      return null;
    } else {
      return { 'invalidServiceRate': true };
    }
  }

  maxLength50(control: FormControl) {
    if (!control.value || control.value.length <= 50) {
      return null;
    } else {
      return { 'invalidMaxLength50': true };
    }
  }

  validHeight(control: FormControl) {
    if (control.value) {
      // Allow any number of digits followed by an optional decimal and any number of digits
      const match = String(control.value).match(/^\d*\.?\d*$/);
      if (match) {
        return null;
      } else {
        return { 'invalidHeight': true };
      }
    }
  }

  wholeNumber(control: FormControl) {
    if (control.value) {
      // Allow any number of digits greater than 0
      const match = String(control.value).match(/^\d*$/);
      if (match && control.value > 0) {
        return null;
      } else {
        return { 'invalidWholeNumber': true };
      }
    } else {
      return { 'invalidWholeNumber': true };
    }
  }

}
