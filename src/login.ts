// Login Constants.
// This file contains all your Firebase settings, and app routes.
// It's important to set in your Firebase, Facebook, and Google app credentials here.
// If you have a different view for the homePage, trialPage, and verificationPage
// You can import them here and set them accordingly.
// If you want to disable emailVerification, simply set it to false.

import { VerificationPage } from './pages/verification/verification';
import { TrialPage } from './pages/trial/trial';
import {VoterBallotsPage} from "./pages/voter-ballots/voter-ballots";
import {ManageBallotsPage} from "./pages/manage-ballots/manage-ballots";

export namespace Login {
  // Get your Firebase app's config on your Firebase console. "Add Firebase to your web app".
  export const firebaseConfig = {
    apiKey: "AIzaSyCL3p6Ixll1JnLrruNowmFHOddy-8TKop0",
    authDomain: "netvote-160820.firebaseapp.com",
    databaseURL: "https://netvote-160820.firebaseio.com",
    storageBucket: "netvote-160820.appspot.com",
    messagingSenderId: "201280024085"
  };
  // Get your Facebook App Id from your app at http://developers.facebook.com
  export const facebookAppId: string = "454672241530891";
  // Get your Google Web Client Id from your Google Project's Credentials at https://console.developers.google.com/apis/credentials
  // Or from your google-services.json under:
  // "oauth_client": [
  //   {
  //     "client_id": "31493597450-u75kd39sk6f8q6r4bfh807oush6tq7lu.apps.googleusercontent.com",
  //     "client_type": 3
  //   }
  // ]
  // MAKE SURE TO GET THE client_id OF client_type 3 and NOT client_type 1!!!
  export const googleClientId: string = "201280024085-u8ia4hloe3ru8n6j7j4e9qggikg0bdgb.apps.googleusercontent.com";
  // Set in your appropriate Login routes, don't forget to import the pages on app.module.ts
  export const homePage = VoterBallotsPage;
  export const verificationPage = VerificationPage;
  export const trialPage = TrialPage;
  // Set whether emailVerification is enabled or not.
  export const emailVerification: boolean = true;
}
