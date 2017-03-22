import {Component, ChangeDetectorRef} from '@angular/core';
import {NavParams, MenuController, ActionSheetController} from 'ionic-angular';
import * as firebase from 'firebase';


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

  constructor(public actionSheetCtrl: ActionSheetController, public menuCtrl: MenuController, public navParam: NavParams, public cdr: ChangeDetectorRef) {
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
        this.ballots.push(this.toUIBallot(ballot));
        this.cdr.detectChanges();
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

  // Toggle sidebar
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  private toUIBallot(b){
    return {"key": b.key, "val": b.val()}
  }

}
