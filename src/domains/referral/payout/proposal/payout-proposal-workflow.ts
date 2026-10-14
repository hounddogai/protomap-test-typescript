import * as clock from "../../../../kit/clock.js";
import { PayoutProposalEngine, defaultPayoutProposalEngine } from "./payout-proposal-engine.js";
import { PayoutProposalValidator, defaultPayoutProposalValidator } from "./payout-proposal-rules.js";
import { PayoutProposalStore } from "./payout-proposal-store.js";

/** Moves payout proposals through their life cycle and keeps a journal of what it did. */
export class PayoutProposalManager {
  store: PayoutProposalStore;
  validator: PayoutProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutProposalEngine;

  constructor(
    store: PayoutProposalStore,
    validator: PayoutProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutProposalEngine,
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
      throw new Error(`payout proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout proposal ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPayoutProposalManager(store: PayoutProposalStore, clockValue: clock.Clock): PayoutProposalManager {
  return new PayoutProposalManager(
    store,
    defaultPayoutProposalValidator(),
    clockValue,
    [],
    defaultPayoutProposalEngine(),
  );
}
