import * as clock from "../../../../kit/clock.js";
import { BidRuleManifestEngine, defaultBidRuleManifestEngine } from "./bid-rule-manifest-engine.js";
import { BidRuleManifestValidator, defaultBidRuleManifestValidator } from "./bid-rule-manifest-rules.js";
import { BidRuleManifestStore } from "./bid-rule-manifest-store.js";

/** Moves bid rule manifests through their life cycle and keeps a journal of what it did. */
export class BidRuleManifestService {
  store: BidRuleManifestStore;
  validator: BidRuleManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleManifestEngine;

  constructor(
    store: BidRuleManifestStore,
    validator: BidRuleManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleManifestEngine,
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
      throw new Error(`bid rule manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule manifest ${code} not found`);
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
      throw new Error(`bid rule manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBidRuleManifestService(store: BidRuleManifestStore, clockValue: clock.Clock): BidRuleManifestService {
  return new BidRuleManifestService(
    store,
    defaultBidRuleManifestValidator(),
    clockValue,
    [],
    defaultBidRuleManifestEngine(),
  );
}
