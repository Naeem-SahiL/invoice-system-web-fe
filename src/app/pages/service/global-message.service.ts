import { Injectable } from '@angular/core';
import { ToastMessageOptions } from 'primeng/api';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalMessageService {

    private messageSubject = new Subject<ToastMessageOptions>();
    message$ = this.messageSubject.asObservable();


  showMessage(message: ToastMessageOptions) {
    this.messageSubject.next(message);
  }
}
