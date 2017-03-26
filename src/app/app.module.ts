import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { VerificationPage } from '../pages/verification/verification';
import { TrialPage } from '../pages/trial/trial';
import { LoginProvider } from '../providers/login';
import { LogoutProvider } from '../providers/logout';
import { LoadingProvider } from '../providers/loading';
import { AlertProvider } from '../providers/alert';
import { ImageProvider } from '../providers/image';
import * as firebase from 'firebase';
import { AngularFireModule, AuthMethods, AuthProviders } from 'angularfire2';
import { Login } from '../login';
import {ManageBallotsPage} from "../pages/manage-ballots/manage-ballots";
import {VoterBallotsPage} from "../pages/voter-ballots/voter-ballots";
import {VoterBallotPage} from "../pages/voter-ballot/voter-ballot";
import {MoreInfoModalPage} from "../pages/voter-ballot/voter-ballot-more-info";
import {VoterBallotStatusPage} from "../pages/voter-ballot/voter-ballot-status";

firebase.initializeApp(Login.firebaseConfig);

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    HomePage,
    VerificationPage,
    TrialPage,
    ManageBallotsPage,
    VoterBallotsPage,
    VoterBallotPage,
    MoreInfoModalPage,
    VoterBallotStatusPage
  ],
  imports: [
    IonicModule.forRoot(MyApp, {
      mode: 'ios'
    }),
    AngularFireModule.initializeApp(Login.firebaseConfig, { method: AuthMethods.Password, provider: AuthProviders.Password })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    HomePage,
    VerificationPage,
    TrialPage,
    ManageBallotsPage,
    VoterBallotsPage,
    VoterBallotPage,
    MoreInfoModalPage,
    VoterBallotStatusPage
  ],
  providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }, LoginProvider, LogoutProvider, LoadingProvider, AlertProvider, ImageProvider]
})
export class AppModule { }
