import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BidRuleDigestEngine, defaultBidRuleDigestEngine } from "./bid-rule-digest-engine.js";
import { BidRuleDigestValidator, defaultBidRuleDigestValidator } from "./bid-rule-digest-rules.js";
import { BidRuleDigestStore } from "./bid-rule-digest-store.js";

/** Moves bid rule digests through their life cycle and keeps a journal of what it did. */
export class BidRuleDigestManager {
  store: BidRuleDigestStore;
  validator: BidRuleDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleDigestEngine;

  constructor(
    store: BidRuleDigestStore,
    validator: BidRuleDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleDigestEngine,
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
      throw new Error(`bid rule digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newBidRuleDigestManager(store: BidRuleDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): BidRuleDigestManager {
  return new BidRuleDigestManager(
    store,
    defaultBidRuleDigestValidator(),
    clockValue,
    [],
    defaultBidRuleDigestEngine(flagsValue),
  );
}
