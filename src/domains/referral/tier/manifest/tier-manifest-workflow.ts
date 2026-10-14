import * as clock from "../../../../kit/clock.js";
import { TierManifestEngine, defaultTierManifestEngine } from "./tier-manifest-engine.js";
import { TierManifestValidator, defaultTierManifestValidator } from "./tier-manifest-rules.js";
import { TierManifestStore } from "./tier-manifest-store.js";

/** Moves tier manifests through their life cycle and keeps a journal of what it did. */
export class TierManifestWorkflow {
  store: TierManifestStore;
  validator: TierManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierManifestEngine;

  constructor(
    store: TierManifestStore,
    validator: TierManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierManifestEngine,
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
      throw new Error(`tier manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier manifest ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTierManifestWorkflow(store: TierManifestStore, clockValue: clock.Clock): TierManifestWorkflow {
  return new TierManifestWorkflow(store, defaultTierManifestValidator(), clockValue, [], defaultTierManifestEngine());
}
