import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { getItemFromLocalStorage, setItemInLocalStorage } from './models/utils';
import { Token } from './models/Token';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.headers.has('Content-Type')) {
      req = req.clone({
        headers: req.headers.set('Content-Type', 'application/json')
      });
    }

    if (this.authService.getIsAuth()) {
      const token = getItemFromLocalStorage('token') as Token;
      req = req.clone({
        setHeaders: {
          'Authorization': `${token.token_type} ${token.access_token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse, caught) => {
        if (error && error.status === 401) {
          const return$ = this.authService.logout();
          if (return$ instanceof Observable) {
            return$.subscribe(data => {
              setItemInLocalStorage('token', null);
              this.router.navigate(['/login']);
            });
          }
          // return an observable with a user-facing error message
          return throwError('Votre session est expirée, veuillez vous reconnecter svp !');
        }
      })
    );
  }
}