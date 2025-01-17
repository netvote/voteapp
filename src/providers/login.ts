import { Injectable } from '@angular/core';
import { OauthCordova } from 'ng2-cordova-oauth/platform/cordova';
import * as firebase from 'firebase';
import { Login } from '../login';
import { NavController } from 'ionic-angular';
import { LoadingProvider } from './loading';
import { AlertProvider } from './alert';
import { GooglePlus, Facebook } from 'ionic-native';

@Injectable()
export class LoginProvider {
  // Login Provider
  // This is the provider class for most of the login functionalities on Firebase.
  // It's important that you set your Firebase and Social settings on login.ts
  // Other customizations can be done on login.ts such as setting your own the homePage,
  // trialPage, and verificationPages or disabling emailVerification.
  // It's important to hook this provider up with your navCtrl
  // In the constructor of the controller that uses this provider, call setNavController(navCtrl).
  private oauth: OauthCordova;
  private navCtrl: NavController;

  constructor(public loadingProvider: LoadingProvider, public alertProvider: AlertProvider) {
    console.log("Initializing Login Provider");
    this.oauth = new OauthCordova();
    // Detect changes on the Firebase user and redirects the view depending on the user's status.
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
          let providerId = user.providerData[0];

        if (user["isAnonymous"]) {
          //Goto Trial Page.
          this.navCtrl.setRoot(Login.trialPage);
        } else {
          if (Login.emailVerification) {
            if (providerId != 'password' || (providerId == 'password' && user["emailVerified"])) {
              //Goto Home Page.
              this.navCtrl.setRoot(Login.homePage);
            } else {
              //Goto Verification Page.
              this.navCtrl.setRoot(Login.verificationPage);
            }
          } else {
            //Goto Home Page.
            this.navCtrl.setRoot(Login.homePage);
          }
        }
      }
    });
  }

  // Hook this provider up with the navigationController.
  // This is important, so the provider can redirect the app to the views depending
  // on the status of the Firebase user.
  setNavController(navCtrl) {
    this.navCtrl = navCtrl;
  }

  private createUserData(): Promise<any> {
    return new Promise((resolve, reject) => {
      firebase.database().ref('accounts/' + firebase.auth().currentUser.uid).once('value')
          .then((account) => {
            // No database data yet, create user data on database
            if (account.val()) {
              resolve(account.val())
            }
            else {
              this.loadingProvider.show();
              let user = firebase.auth().currentUser;
              let userId, name, provider, img, email;
              let providerData = user.providerData[0];

              //console.log("creating: " + JSON.stringify(providerData));

              userId = user.uid;
              email = user.email;
              name = user.displayName || providerData.displayName || "Netvote User";
              img = user.photoURL || providerData.photoURL;
              provider = LoginProvider.toProviderName(providerData.providerId);

              let acctObj = {
                userId: userId,
                name: name,
                provider: provider,
                img: img,
                email: email,
                dateCreated: new Date().toString()
              };

              // Insert data on our database using AngularFire.
              firebase.database().ref('/accounts/' + userId).set(acctObj).then(() => {
                resolve(acctObj);
                this.loadingProvider.hide();
              });
            }
          });
    });
  }

  static toProviderName(providerId){
      if (providerId == 'facebook.com') {
          return "Facebook";
      } else if (providerId == 'google.com') {
          return "Google";
      }else{
          return "Netvote";
      }
  }

  // Facebook Login, after successful authentication, triggers firebase.auth().onAuthStateChanged((user) on top and
  // redirects the user to its respective views. Make sure to set your FacebookAppId on login.ts
  // and enabled Facebook Login on Firebase app authentication console.
  facebookLogin(){
    Facebook.login(["public_profile","email"]).then((resp) =>{
      let token = resp.authResponse.accessToken;
      let credential = firebase.auth.FacebookAuthProvider.credential(token);
      this.loadingProvider.show();
      firebase.auth().signInWithCredential(credential)
          .then((success) => {
            return this.createUserData()
          })
          .then((account) => {
            this.loadingProvider.hide();
          })
          .catch((error) => {
            this.loadingProvider.hide();
            let code = error["code"];
            this.alertProvider.showErrorMessage(code);
          });
    });
  }

  // Google Login, after successful authentication, triggers firebase.auth().onAuthStateChanged((user) on top and
  // redirects the user to its respective views. Make sure there's a REVERSED_CLIENT_ID set on your config.xml and
  // enabled Google Login and have whitelisted CLIENT_ID's value on Firebase console.
  googleLogin() {
    this.loadingProvider.show();
    GooglePlus.login({}).then((success) => {
      let credential = firebase.auth.GoogleAuthProvider.credential(success['idToken'], null);
      firebase.auth().signInWithCredential(credential)
          .then((success) => {
            return this.createUserData()
          })
          .then((account) => {
            this.loadingProvider.hide();
          })
        .catch((error) => {
          this.loadingProvider.hide();
          let code = error["code"];
          this.alertProvider.showErrorMessage(code);
        });
    }).catch((error) => { this.loadingProvider.hide(); });
  }

  // Anonymous Login, after successful authentication, triggers firebase.auth().onAuthStateChanged((user) on top and
  // redirects the user to its respective views. Make sure to enable Anonymous login on Firebase app authentication console.
  guestLogin() {
    this.loadingProvider.show();
    firebase.auth().signInAnonymously()
      .then((success) => {
        this.loadingProvider.hide();
      })
      .catch((error) => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Login on Firebase given the email and password.
  emailLogin(email, password) {
    this.loadingProvider.show();
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((success) => {
          return this.createUserData()
        })
        .then((account) => {
          this.loadingProvider.hide();
        })
      .catch((error) => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Register user on Firebase given the email and password.
  register(email, password) {
    this.loadingProvider.show();
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((success) => {
          return this.createUserData()
        })
        .then((account) => {
          this.loadingProvider.hide();
        })
      .catch((error) => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Send Password Reset Email to the user.
  sendPasswordReset(email) {
    this.loadingProvider.show();
    firebase.auth().sendPasswordResetEmail(email)
      .then((success) => {
        this.loadingProvider.hide();
        this.alertProvider.showPasswordResetMessage(email);
      })
      .catch((error) => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

}
