import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalComplaintManifestEngine,
  defaultRegionalComplaintManifestEngine,
} from "./regional-complaint-manifest-engine.js";
import {
  RegionalComplaintManifestValidator,
  defaultRegionalComplaintManifestValidator,
} from "./regional-complaint-manifest-rules.js";
import { RegionalComplaintManifestStore } from "./regional-complaint-manifest-store.js";

/** Moves regional complaint manifests through their life cycle and keeps a journal of what it did. */
export class RegionalComplaintManifestCoordinator {
  store: RegionalComplaintManifestStore;
  validator: RegionalComplaintManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalComplaintManifestEngine;

  constructor(
    store: RegionalComplaintManifestStore,
    validator: RegionalComplaintManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalComplaintManifestEngine,
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
      throw new Error(`regional complaint manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional complaint manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional complaint manifest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalComplaintManifestCoordinator(store: RegionalComplaintManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalComplaintManifestCoordinator {
  return new RegionalComplaintManifestCoordinator(
    store,
    defaultRegionalComplaintManifestValidator(),
    clockValue,
    [],
    defaultRegionalComplaintManifestEngine(flagsValue),
  );
}
