import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortManifestEngine, defaultCohortManifestEngine } from "./cohort-manifest-engine.js";
import { CohortManifestValidator, defaultCohortManifestValidator } from "./cohort-manifest-rules.js";
import { CohortManifestStore } from "./cohort-manifest-store.js";

/** Moves cohort manifests through their life cycle and keeps a journal of what it did. */
export class CohortManifestManager {
  store: CohortManifestStore;
  validator: CohortManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortManifestEngine;

  constructor(
    store: CohortManifestStore,
    validator: CohortManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortManifestEngine,
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
      throw new Error(`cohort manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort manifest ${code} not found`);
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
      throw new Error(`cohort manifest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCohortManifestManager(store: CohortManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortManifestManager {
  return new CohortManifestManager(
    store,
    defaultCohortManifestValidator(),
    clockValue,
    [],
    defaultCohortManifestEngine(flagsValue),
  );
}
