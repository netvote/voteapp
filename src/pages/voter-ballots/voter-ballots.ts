import {Component, ChangeDetectorRef} from '@angular/core';
import {NavController, NavParams, MenuController} from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public menuCtrl: MenuController, public navParam: NavParams, public cdr: ChangeDetectorRef) {
    this.ballotId = this.navParam.get("ballotId");
  }

  addBallot(ballotId){
    console.log("entered addBallot('"+ballotId+"')");

    if(ballotId != null){
      console.log("ballotId: "+ballotId);
      firebase.database().ref('/ballot-configs/' + ballotId).once("value").then((ballot) => {
        //TODO: if I can add the ballot
        console.log("adding ballot: /voter-ballot-lists/" + this.userId + '/' + ballotId);
        try {
          firebase.database().ref('/voter-ballot-lists/' + this.userId).child(ballotId).set(ballot.val()).catch((e) =>{
            //console.log("reject! "+JSON.stringify(e))
          });
          //console.log("added!")
        }catch(e){

        }
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

    ballotsRef.once("value").then((ballots) =>{
      let tmpBallots = [];
      ballots.forEach((ballot) => {
        //console.log(JSON.stringify(ballot));
        tmpBallots.push(this.toUIBallot(ballot))
      });
      this.ballots = tmpBallots;
      this.cdr.detectChanges();
    });

    ballotsRef.on('child_added', (b) => {
      this.ballots.push(this.toUIBallot(b))
      this.cdr.detectChanges();
    });

    ballotsRef.on('child_changed',(b) => {
      let tmpBallots = [];

      this.ballots.forEach((ballot) => {
        if(ballot.key == b.key) {
          tmpBallots.push(this.toUIBallot(b))
        }else{
          tmpBallots.push(ballot)
        }
      });
      this.ballots = tmpBallots;
      this.cdr.detectChanges();
    });

    ballotsRef.on('child_removed', (b) => {
      for(let i=0; i<this.ballots.length; i++){
        if(this.ballots[i].key == b.key){
          this.ballots.splice( i, 1 );
          this.cdr.detectChanges();
          return;
        }
      }
    });

  }

  // Toggle sidebar
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  private toUIBallot(b){
    return {"key": b.key, "val": b.val()}
  }

}
