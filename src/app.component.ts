import { GlobalMessageService } from './app/pages/service/global-message.service';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StaticAppConfig } from './app/pages/service/config.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterModule,
        Toast
    ],
    template: `
    <router-outlet></router-outlet>
    <p-toast></p-toast>
    `,
    providers: [MessageService, GlobalMessageService],
})
export class AppComponent implements OnInit {
    constructor(
        private GlobalMessageService: GlobalMessageService,
        private messageService: MessageService
    ) {
    }
    ngOnInit() {
        this.GlobalMessageService.message$.subscribe(message => {
            this.messageService.add(message);
        });
    }




}
