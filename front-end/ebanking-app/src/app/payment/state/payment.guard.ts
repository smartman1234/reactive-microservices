import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {Store} from "@ngrx/store";
import {State} from "../../reducer/index";
import {Injectable} from "@angular/core";
import {InitPaymentRequest} from "./payment.actions";
import {of} from "rxjs/observable/of";
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import {RequestAccounts, RequestPayees} from "../../dashboard/reducers/account.actions";
import {combineLatest} from "rxjs/observable/combineLatest";
import * as fromAccounts from "../../dashboard/reducers";

@Injectable()
export class PaymentGuard implements CanActivate {
    constructor(private store: Store<State>){}

    dataAvailable(): Observable<any> {
        let payementRequest$ = this.store.select('paymentRequest').do(d => {
            if(!d) {
                this.store.dispatch(new InitPaymentRequest());
            }
        }).filter(d => !!d);
        let accounts$ = this.store.select(fromAccounts.getAccountsState).do(d => {
            if(!d || (!d.accountLoading && d.accounts && d.accounts.length === 0)) {
                console.log('Requesting accounts ...');
                this.store.dispatch(new RequestAccounts());
            }
        }).filter(d => d && !d.accountLoading);

        let payees$ = this.store.select('payees').do(d => {
            if(!d || (d.payees && d.payees.length === 0)) {
                this.store.dispatch(new RequestPayees());
            }
        }).filter(d => d && !d.payeesLoading);
        return combineLatest(payementRequest$, accounts$, payees$).take(1);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return this.dataAvailable().switchMap(() => of(true)).catch(() => of(false));
    }

}