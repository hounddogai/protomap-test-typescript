import * as clock from "../../../../kit/clock.js";
import { BidRuleBundleEngine, defaultBidRuleBundleEngine } from "./bid-rule-bundle-engine.js";
import { BidRuleBundleValidator, defaultBidRuleBundleValidator } from "./bid-rule-bundle-rules.js";
import { BidRuleBundleStore } from "./bid-rule-bundle-store.js";

/** Moves bid rule bundles through their life cycle and keeps a journal of what it did. */
export class BidRuleBundleDesk {
  store: BidRuleBundleStore;
  validator: BidRuleBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleBundleEngine;

  constructor(
    store: BidRuleBundleStore,
    validator: BidRuleBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleBundleEngine,
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
      throw new Error(`bid rule bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule bundle ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newBidRuleBundleDesk(store: BidRuleBundleStore, clockValue: clock.Clock): BidRuleBundleDesk {
  return new BidRuleBundleDesk(store, defaultBidRuleBundleValidator(), clockValue, [], defaultBidRuleBundleEngine());
}
