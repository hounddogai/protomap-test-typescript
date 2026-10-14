import * as clock from "../../../../kit/clock.js";
import { CreditTargetEngine, defaultCreditTargetEngine } from "./credit-target-engine.js";
import { CreditTargetValidator, defaultCreditTargetValidator } from "./credit-target-rules.js";
import { CreditTargetStore } from "./credit-target-store.js";

/** Moves credit targets through their life cycle and keeps a journal of what it did. */
export class CreditTargetService {
  store: CreditTargetStore;
  validator: CreditTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditTargetEngine;

  constructor(
    store: CreditTargetStore,
    validator: CreditTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditTargetEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit target ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCreditTargetService(store: CreditTargetStore, clockValue: clock.Clock): CreditTargetService {
  return new CreditTargetService(store, defaultCreditTargetValidator(), clockValue, [], defaultCreditTargetEngine());
}
