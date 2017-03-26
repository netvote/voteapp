import {Component, ChangeDetectorRef} from '@angular/core';
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
  private ballotMap: any = {}

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

  isOpen(key){
    let now = new Date().getTime();
    return this.ballotMap[key].startTime.getTime() <= now && this.ballotMap[key].endTime.getTime() > now
  }

  isClosed(key){
    let now = new Date().getTime();
    return this.ballotMap[key].endTime.getTime() < now
  }

  isFuture(key){
    let now = new Date().getTime();
    return this.ballotMap[key].startTime.getTime() > now
  }

  private addBallotToMap(ballot){
    let startTime = new Date(ballot.val().config.Ballot.StartTimeSeconds * 1000);
    let endTime = new Date(ballot.val().config.Ballot.EndTimeSeconds * 1000);

    this.ballotMap[ballot.key] = {
      startTime: startTime,
      endTime: endTime
    //  startTimeText: dateFormat(startTime, "mm/dd/yyyy HH:MM:SS" ),
     // endTimeText: dateFormat(endTime, "mm/dd/yyyy HH:MM:SS" )
    }
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
          this.addBallotToMap(ballot);
          this.ballots.push(this.toUIBallot(ballot));
        }
      });
      this.cdr.detectChanges()
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
      this.cdr.detectChanges()
    });

    this.cdr.detectChanges()
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
