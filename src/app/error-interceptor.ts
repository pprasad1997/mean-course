import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthService } from "./auth/auth.service";
import { ErrorComponent } from "./error/error.component";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private dialog: MatDialog) {}
  intercept(req: HttpRequest<any>, next:HttpHandler){
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errMessage = "An Unknown Error Occured!!";
        if(error.error.message){
          errMessage = error.error.message;
        }
        this.dialog.open(ErrorComponent, {data: {message: errMessage}});
        return throwError(error);
      })
    );
  }
}
