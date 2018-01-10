import {Component, OnInit, OnChanges} from '@angular/core';
import {Account} from "../core/accounts/account";
import {FormGroup, FormBuilder, Validators, FormControl} from "@angular/forms";
import {AccountService} from "../core/accounts/account.service";
import * as appState from "../reducers";
import {Store} from "@ngrx/store";
import {Observable} from "rxjs/Observable";
import {
    InitPaymentRequest, UpdateFromAccount, UpdatePaymentAmount, UpdatePaymentDate, UpdatePaymentNotes,
    UpdatePaymentStatus,
    UpdateToAccount
} from "./state/payment.actions";
import { map } from "rxjs/operator/map";
import { filter } from "rxjs/operator/filter";
import "rxjs/add/operator/do";
import {RequestPayees} from "../dashboard/state/account.actions";
import {Payee} from "../core/accounts/payee";
import {NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {Router} from "@angular/router";
import {PaymentStatus} from "../reducers";

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnChanges {

  protected paymentForm: FormGroup;

  protected paymentRequest$: Observable<appState.PaymentRequest>;

  protected fromAccounts$ : Observable<Account[]>;
  protected fromAccount$: Observable<Account>;

  protected toAccounts$: Observable<Payee[]>;
  protected toAccount$: Observable<Payee>;
  protected startDate$: Observable<NgbDateStruct>;
  protected amount$: Observable<number>;
  protected notes$: Observable<string>;

  protected notes: string;



  constructor( private accountService: AccountService,
               private fb: FormBuilder,
               private store: Store<appState.State>,
               private router: Router) {

  }

  ngOnInit() {
    this.paymentRequest$ = this.store.select('paymentRequest');

    this.store.dispatch(new RequestPayees());
    this.store.dispatch(new InitPaymentRequest());



    this.fromAccounts$ = this.store.select('accounts').map((t: appState.AccountsState) => t.accounts);
    this.fromAccount$ = map.call(filter.call(this.paymentRequest$, t => !!t), t => t.fromAccount);

    this.toAccounts$ = this.store.select('payees').map((t: appState.PayeesState) => t.payees);
    this.toAccount$ = this.paymentRequest$.filter(t => !!t).map(t => t.toAccount);

    this.startDate$ = this.paymentRequest$.filter(t => !!t).map(t => t.paymentDate);
    this.amount$ = this.paymentRequest$.filter(t => !!t).map(t => t.amount);
    this.notes$ = this.paymentRequest$.filter(t => !!t).map(t => t.notes);

    this.paymentRequest$.filter(t => !!t).subscribe(p => {
        this.notes = p.notes;
    });
    this.createForm();

  }

  ngOnChanges(): void {
    console.log(`new value ${this.paymentForm}`);
  }

  resetPaymentRequest() {
    this.store.dispatch(new InitPaymentRequest());
  }

  submit() {
    console.log(`Form submitted`);
    this.store.dispatch(new UpdatePaymentStatus(PaymentStatus.CONFIRMED));
    this.router.navigate(['confirm-payment']).catch(err => console.log(err));
  }

  accountSelected(event: Account) {
    console.log(`The form: `, this.paymentForm);
    console.log(`Account selected was `, event.accountName);
    this.store.dispatch(new UpdateFromAccount(event));
  }

  payeeSelected(payee: Payee) {
    console.log(`Payee selected was`, payee);
    this.store.dispatch(new UpdateToAccount(payee));
  }

  startDateUpdated(date: NgbDateStruct) {
    this.store.dispatch(new UpdatePaymentDate(date));
  }

  amountChanged(amount: string) {
    if (amount) {
        let amountValue = Number(amount);
        if (amountValue && !isNaN(amountValue)) {
            this.store.dispatch(new UpdatePaymentAmount(Number(amount)));
        }
    }
  }

  notesChanged(notes: string) {
    this.store.dispatch(new UpdatePaymentNotes(notes));
  }

  private createForm() {
    this.paymentForm = this.fb.group({
      fromAccount: [null, Validators.required],
      toAccount: [null, Validators.required],
      startDate: [null, Validators.required],
      amount: ['', {validators: Validators.required, updateOn: 'blur'}],
      notes: ['', {updateOn: 'blur'}],
    });
  }

}
