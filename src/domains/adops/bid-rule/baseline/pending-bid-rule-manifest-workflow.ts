import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingBidRuleManifestEngine,
  defaultPendingBidRuleManifestEngine,
} from "./pending-bid-rule-manifest-engine.js";
import {
  PendingBidRuleManifestValidator,
  defaultPendingBidRuleManifestValidator,
} from "./pending-bid-rule-manifest-rules.js";
import { PendingBidRuleManifestStore } from "./pending-bid-rule-manifest-store.js";

/** Moves pending bid rule manifests through their life cycle and keeps a journal of what it did. */
export class PendingBidRuleManifestService {
  store: PendingBidRuleManifestStore;
  validator: PendingBidRuleManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBidRuleManifestEngine;

  constructor(
    store: PendingBidRuleManifestStore,
    validator: PendingBidRuleManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBidRuleManifestEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule manifest ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPendingBidRuleManifestService(store: PendingBidRuleManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingBidRuleManifestService {
  return new PendingBidRuleManifestService(
    store,
    defaultPendingBidRuleManifestValidator(),
    clockValue,
    [],
    defaultPendingBidRuleManifestEngine(flagsValue),
  );
}
