
import {NavParams, ViewController} from "ionic-angular";
import {Component} from "@angular/core";

@Component({
    templateUrl: 'voter-ballot-more-info.html'
})
export class MoreInfoModalPage {

    private option: any;

    constructor(public viewCtrl: ViewController, public navParams: NavParams) {
        this.option = navParams.get("option");
        console.log("modal option="+JSON.stringify(this.option))
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }
}
