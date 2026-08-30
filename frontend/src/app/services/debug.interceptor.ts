import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/auth/')) {
      console.log('📤 REQUEST:', {
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers.keys()
      });
    }

    return next.handle(req).pipe(
      tap(event => {
        if (req.url.includes('/auth/')) {
          console.log('📥 SUCCESS RESPONSE:', event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (req.url.includes('/auth/')) {
          console.log('❌ ERROR RESPONSE:', {
            url: req.url,
            status: error.status,
            message: error.message,
            body: error.error
          });
        }
        throw error;
      })
    );
  }
}
