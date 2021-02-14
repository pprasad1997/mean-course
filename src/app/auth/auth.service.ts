import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Subject } from 'rxjs';

import { environment } from "../../environments/environment";
import { AuthData } from "./auth-data.model";
import { Router } from '@angular/router';

const BACKEND_URL = environment.apiUrl + "/user/";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isAuthenticated: boolean = false;
  private userId: string;
  private token: string;
  private tokenTimer: any;
  private authListener = new Subject<boolean>();
  constructor(private http: HttpClient, private router: Router) { }

  getToken(){
    return this.token;
  }

  getAuthStatus(){
    return this.isAuthenticated;
  }

  getAuthListener(){
    return this.authListener.asObservable();
  }

  getUserId(){
    return this.userId;
  }

  addUser(email: string, password: string){
    const user: AuthData = {
      email: email,
      password: password
    }
    this.http.post(BACKEND_URL + "signup", user)
      .subscribe(() => {
        this.router.navigate(['']);
      }, err => {
        console.log(err);
        this.authListener.next(false);
      });
  }

  login(email: string, password: string){
    const user: AuthData = {
      email: email,
      password: password
    }
    this.http.post<{token: string, expiresIn: number, userId: string}>(BACKEND_URL + "login", user)
      .subscribe(result => {
        const token = result.token;
        if(token){
          const expirationDuration = result.expiresIn;
          this.token = token;
          this.authListener.next(true);
          this.isAuthenticated = true;
          this.tokenTimer = this.setAuthTimer(expirationDuration);
          this.userId = result.userId;

          const now = new Date();
          const expirationDate = new Date(now.getTime() + expirationDuration * 1000);
          this.saveAuthData(token, expirationDate, this.userId);

          this.router.navigate([""]);
        }
      }, err => {
        this.authListener.next(false);
      });
  }

  logout(){
    this.token = null
    this.isAuthenticated = false;
    this.authListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.userId = null;
    this.router.navigate([""]);
  }

  autoAuthData(){
    const authData = this.getAuthData();
    if(!authData){
      return;
    }
    const now = new Date();
    const expiresIn = authData.expirationDate.getTime() - now.getTime();
    if(expiresIn > 0){
      this.token = authData.token;
      this.userId = authData.userId;
      this.setAuthTimer(expiresIn / 1000);
      this.isAuthenticated = true;
      this.authListener.next(false);
    }
  }

  private setAuthTimer(expiresIn){
    setTimeout(() => {
      this.logout();
    }, expiresIn * 1000);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string){
    localStorage.setItem("token", token);
    localStorage.setItem("expirationDate", expirationDate.toISOString());
    localStorage.setItem("userId", userId);
  }

  private clearAuthData(){
    localStorage.removeItem("token");
    localStorage.removeItem("expirationDate");
    localStorage.removeItem("userId");
  }

  private getAuthData(){
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expirationDate");
    const userId = localStorage.getItem("userId");

    if(!token || !expirationDate){
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId
    }
  }

}
