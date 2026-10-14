import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionManifestEngine, defaultRetentionManifestEngine } from "./retention-manifest-engine.js";
import { RetentionManifestValidator, defaultRetentionManifestValidator } from "./retention-manifest-rules.js";
import { RetentionManifestStore } from "./retention-manifest-store.js";

/** Moves retention manifests through their life cycle and keeps a journal of what it did. */
export class RetentionManifestCoordinator {
  store: RetentionManifestStore;
  validator: RetentionManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionManifestEngine;

  constructor(
    store: RetentionManifestStore,
    validator: RetentionManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionManifestEngine,
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
      throw new Error(`retention manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRetentionManifestCoordinator(store: RetentionManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionManifestCoordinator {
  return new RetentionManifestCoordinator(
    store,
    defaultRetentionManifestValidator(),
    clockValue,
    [],
    defaultRetentionManifestEngine(flagsValue),
  );
}
