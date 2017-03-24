import {Component, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import {NavParams, MenuController, ActionSheetController, AlertController, NavController} from 'ionic-angular';
import * as firebase from 'firebase';
import {VoterBallotPage} from "../voter-ballot/voter-ballot";


/*
  Generated class for the VoterBallots page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-voter-ballots',
  templateUrl: 'voter-ballots.html'
})
export class VoterBallotsPage {

  private ballots: any = [];
  private userId: string;
  private ballotId: string = null;
  private voteTimers: any = {};
  private refreshInterval: any = null;

  constructor(public navCtrl: NavController, public actionSheetCtrl: ActionSheetController, public alertCtrl: AlertController, public menuCtrl: MenuController, public navParam: NavParams, public cdr: ChangeDetectorRef) {
    this.ballotId = this.navParam.get("ballotId");
  }

  addBallot(ballotId){
    if(ballotId != null){
      console.log("adding ballotId: "+ballotId);
      this.getBallot(ballotId).then((ballot) => {
        //TODO: if I can add the ballot
        //TODO: already voted?
        console.log("adding ballot: /voter-ballot-lists/" + this.userId + '/' + ballotId);
        firebase.database().ref('/voter-ballot-lists/' + this.userId).child(ballotId).set(true).catch((e) =>{});
      });
    }
  }

  timeLeft(secondsTime){
    let now = Math.floor(new Date().getTime()/1000);
    return this.toHHMMSS((secondsTime - now));
  }

  toHHMMSS(secs) {
    let sec_num = parseInt(secs, 10);
    let hours = Math.floor(sec_num / 3600) % 24;
    let minutes = Math.floor(sec_num / 60) % 60;
    let seconds = sec_num % 60;
    return [hours, minutes, seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v, i) => v !== "00" || i > 0)
        .join(":")
  };

  private getBallot(ballotId){
    console.log("getting ballot-config: "+ballotId);
    return firebase.database().ref('/ballot-configs/' + ballotId).once("value");
  }

  private exists(obj){
    return obj && obj !== 'null' && obj !== 'undefined' && JSON.stringify(obj) != 'null';
  }

  private removeBallot(ballotId){
    firebase.database().ref('/voter-ballot-lists/' + this.userId).child(ballotId).remove();
  }

  private addTimer(ballot){
      let ballotConfig = ballot.val().config.Ballot;
      this.voteTimers[ballot.key] = {
          StartTimeSeconds: ballotConfig.StartTimeSeconds,
          EndTimeSeconds: ballotConfig.EndTimeSeconds
      }
  }

  private updateTimes(){
      let now = Math.floor(new Date().getTime()/1000);
      for(let ballotId in this.voteTimers){
          if(this.voteTimers.hasOwnProperty(ballotId)){
              let timeConfig = this.voteTimers[ballotId];
              if(now < timeConfig.StartTimeSeconds){
                  this.voteTimers[ballotId].state = "FUTURE";
                  this.voteTimers[ballotId].timeLeftText = this.timeLeft(timeConfig.StartTimeSeconds);
              }else if(now < timeConfig.EndTimeSeconds){
                  this.voteTimers[ballotId].state = "OPEN";
                  this.voteTimers[ballotId].timeLeftText = this.timeLeft(timeConfig.EndTimeSeconds);
              }else{
                  this.voteTimers[ballotId].state = "CLOSED";
              }
          }
      }
  }

  private startTimer(){
      this.refreshInterval = setInterval(()=>{
          this.updateTimes()
      }, 500)
  }

  private stopTimer(){
      clearInterval(this.refreshInterval);
  }

    ionViewDidEnter(){
        this.startTimer();
    }

    ionViewWillLeave(){
        this.stopTimer();
    }

  ionViewDidLoad() {

    this.menuCtrl.enable(true);
    this.menuCtrl.swipeEnable(true);
    this.menuCtrl.close();
    console.log('ionViewDidLoad VoterBallotsPage');

    let userId = firebase.auth().currentUser.uid;
    this.userId = userId;

    this.addBallot(this.ballotId);

    let ballotsRef = firebase.database().ref('/voter-ballot-lists/' + userId).orderByKey();

    ballotsRef.on('child_added', (b) => {
      console.log("child_added: "+b.key);
      this.getBallot(b.key).then((ballot) => {
        if(this.exists(ballot)){
          this.addTimer(ballot);
          this.ballots.push(this.toUIBallot(ballot));
        }
      });
    });

    ballotsRef.on('child_changed',(b) => {
      let tmpBallots = [];
      console.log("child_changed: "+b.key);
      this.ballots.forEach((ballot) => {
        if(ballot.key == b.key) {
          this.getBallot(ballot.key).then((b) => {
            tmpBallots.push(this.toUIBallot(b));
          });
        }else{
          tmpBallots.push(ballot)
        }
      });
      this.ballots = tmpBallots;
      this.cdr.detectChanges();
    });

    ballotsRef.on('child_removed', (b) => {
      console.log("child_removed: "+b.key);
      for(let i=0; i<this.ballots.length; i++){
        if(this.ballots[i].key == b.key){
          this.ballots.splice( i, 1 );
          this.cdr.detectChanges();
          return;
        }
      }
    });

  }

  confirmRemove(ballotId){
    let confirm = this.alertCtrl.create({
      title: 'Remove this ballot?',
      message: 'Would you like to remove this ballot?',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.removeBallot(ballotId);
          }
        }
      ]
    });
    confirm.present();
  }

  add(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Add Ballot',
      buttons: [
        {
          text: 'Type Key',
          handler: () => {

          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
    actionSheet.present();
  }

  openBallot(ballot){
    this.navCtrl.push(VoterBallotPage, {"ballotId":ballot.key, "ballot": ballot.val});
  }

  // Toggle sidebar
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  private toUIBallot(b){
    return {"key": b.key, "val": b.val()}
  }

}
