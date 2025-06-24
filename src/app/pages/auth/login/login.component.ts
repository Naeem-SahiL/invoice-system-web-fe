import { PrimeNG } from 'primeng/config';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';
import { AuthService } from '../auth.service';
import { GlobalMessageService } from '../../service/global-message.service';


@Component({
  selector: 'app-login',
      imports: [
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        ReactiveFormsModule,
        RouterModule,
        RippleModule,
        AppFloatingConfigurator
    ],

  templateUrl: './login.component.html',
//   styleUrl: './login.component.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    error: string;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router,
        private gloablMsgService: GlobalMessageService
    ) {
        this.loginForm = this.fb.group({
            user_name: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.loginForm.invalid) return;

        this.loading = true;
        this.auth.login(this.loginForm.value).subscribe({
            next: (res) => {
                this.auth.saveToken(res.token);
                this.router.navigate(['/']); // adjust route
            },
            error: (err) => {
                this.error = 'Invalid credentials';
                this.gloablMsgService.showMessage({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'Failed to login.',
                    life: 3000
                });
                this.loading = false
            },
            complete : () => this.loading = false
        });
    }
}
