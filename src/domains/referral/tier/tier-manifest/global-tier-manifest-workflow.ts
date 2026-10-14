import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalTierManifestEngine, defaultGlobalTierManifestEngine } from "./global-tier-manifest-engine.js";
import { GlobalTierManifestValidator, defaultGlobalTierManifestValidator } from "./global-tier-manifest-rules.js";
import { GlobalTierManifestStore } from "./global-tier-manifest-store.js";

/** Moves global tier manifests through their life cycle and keeps a journal of what it did. */
export class GlobalTierManifestService {
  store: GlobalTierManifestStore;
  validator: GlobalTierManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalTierManifestEngine;

  constructor(
    store: GlobalTierManifestStore,
    validator: GlobalTierManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalTierManifestEngine,
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
      throw new Error(`global tier manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global tier manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global tier manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newGlobalTierManifestService(store: GlobalTierManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalTierManifestService {
  return new GlobalTierManifestService(
    store,
    defaultGlobalTierManifestValidator(),
    clockValue,
    [],
    defaultGlobalTierManifestEngine(flagsValue),
  );
}
