import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutDraftEngine, defaultPayoutDraftEngine } from "./payout-draft-engine.js";
import { PayoutDraftValidator, defaultPayoutDraftValidator } from "./payout-draft-rules.js";
import { PayoutDraftStore } from "./payout-draft-store.js";

/** Moves payout drafts through their life cycle and keeps a journal of what it did. */
export class PayoutDraftService {
  store: PayoutDraftStore;
  validator: PayoutDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutDraftEngine;

  constructor(
    store: PayoutDraftStore,
    validator: PayoutDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutDraftEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout draft ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPayoutDraftService(store: PayoutDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutDraftService {
  return new PayoutDraftService(
    store,
    defaultPayoutDraftValidator(),
    clockValue,
    [],
    defaultPayoutDraftEngine(flagsValue),
  );
}
