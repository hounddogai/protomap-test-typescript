import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledActivationManifestEngine,
  defaultScheduledActivationManifestEngine,
} from "./scheduled-activation-manifest-engine.js";
import {
  ScheduledActivationManifestValidator,
  defaultScheduledActivationManifestValidator,
} from "./scheduled-activation-manifest-rules.js";
import { ScheduledActivationManifestStore } from "./scheduled-activation-manifest-store.js";

/** Moves scheduled activation manifests through their life cycle and keeps a journal of what it did. */
export class ScheduledActivationManifestService {
  store: ScheduledActivationManifestStore;
  validator: ScheduledActivationManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledActivationManifestEngine;

  constructor(
    store: ScheduledActivationManifestStore,
    validator: ScheduledActivationManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledActivationManifestEngine,
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
      throw new Error(`scheduled activation manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled activation manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled activation manifest ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newScheduledActivationManifestService(store: ScheduledActivationManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledActivationManifestService {
  return new ScheduledActivationManifestService(
    store,
    defaultScheduledActivationManifestValidator(),
    clockValue,
    [],
    defaultScheduledActivationManifestEngine(flagsValue),
  );
}
