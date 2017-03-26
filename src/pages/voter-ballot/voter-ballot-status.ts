import {NavController, NavParams, ViewController} from "ionic-angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import * as firebase from 'firebase';
import {Login} from "../../login";


@Component({
    templateUrl: 'voter-ballot-status.html'
})
export class VoterBallotStatusPage {

    private voteRef: any;
    private submitted: boolean = false;
    private validated: boolean = false;
    private secured: boolean = false;
    private success: boolean = false;
    private error: boolean = false;
    private errorMessage: string = "";

    private validatingText: string = "Validating";
    private securingText: string = "Securing";
    private submittingText: string = "Submitting";

    constructor(public navCtrl: NavController, public viewCtrl: ViewController, public navParams: NavParams, public cdr: ChangeDetectorRef) {
        this.voteRef = navParams.get("voteRef");
    }

    ionViewDidEnter(){
        console.log("vote ref to: "+this.voteRef);
        firebase.database().ref(this.voteRef).on("value", ((vote)=>{
            console.log("got new item: "+JSON.stringify(vote.val()))
            this.submitted = true;
            this.submittingText = "Submitted";
            if(vote.val().status === "pending"){
                console.log("pending!");
                this.validated = true;
                this.validatingText = "Validated";
            }else if(vote.val().status === "success"){
                console.log("success!");
                this.validated = true;
                this.validatingText = "Validated";
                this.securingText = "Secured"
                this.success = true;
                this.secured = true;
            }else if(vote.val().status === "error"){
                console.log("error!");
                this.error = true;
                this.errorMessage = vote.val().message;
                this.validatingText = this.errorMessage;
            }
            this.cdr.detectChanges()
        }));
    }

    exitVoting(){
        this.navCtrl.setRoot(Login.homePage)
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }
}
