import * as clock from "../../../../kit/clock.js";
import { ScheduledStepManifestEngine, defaultScheduledStepManifestEngine } from "./scheduled-step-manifest-engine.js";
import {
  ScheduledStepManifestValidator,
  defaultScheduledStepManifestValidator,
} from "./scheduled-step-manifest-rules.js";
import { ScheduledStepManifestStore } from "./scheduled-step-manifest-store.js";

/** Moves scheduled step manifests through their life cycle and keeps a journal of what it did. */
export class ScheduledStepManifestCoordinator {
  store: ScheduledStepManifestStore;
  validator: ScheduledStepManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledStepManifestEngine;

  constructor(
    store: ScheduledStepManifestStore,
    validator: ScheduledStepManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledStepManifestEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled step manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled step manifest ${code} not found`);
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
      throw new Error(`scheduled step manifest ${code} not found`);
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

export function newScheduledStepManifestCoordinator(store: ScheduledStepManifestStore, clockValue: clock.Clock): ScheduledStepManifestCoordinator {
  return new ScheduledStepManifestCoordinator(
    store,
    defaultScheduledStepManifestValidator(),
    clockValue,
    [],
    defaultScheduledStepManifestEngine(),
  );
}
