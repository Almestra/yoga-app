import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({ name: 'validationMessage' })
export class ValidationMessagePipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined): string {
    if (errors?.['required']) {
      return 'This field is required';
    }
    if (errors?.['email']) {
      return 'This email address is not valid';
    }
    if (errors?.['minlength']) {
      return `At least ${errors['minlength'].requiredLength} characters`;
    }
    if (errors?.['maxlength']) {
      return `At most ${errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }
}
