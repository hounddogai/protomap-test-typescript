import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingFlightBundleEngine, defaultRollingFlightBundleEngine } from "./rolling-flight-bundle-engine.js";
import { RollingFlightBundleValidator, defaultRollingFlightBundleValidator } from "./rolling-flight-bundle-rules.js";
import { RollingFlightBundleStore } from "./rolling-flight-bundle-store.js";

/** Moves rolling flight bundles through their life cycle and keeps a journal of what it did. */
export class RollingFlightBundleCoordinator {
  store: RollingFlightBundleStore;
  validator: RollingFlightBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingFlightBundleEngine;

  constructor(
    store: RollingFlightBundleStore,
    validator: RollingFlightBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingFlightBundleEngine,
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
      throw new Error(`rolling flight bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling flight bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling flight bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingFlightBundleCoordinator(store: RollingFlightBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingFlightBundleCoordinator {
  return new RollingFlightBundleCoordinator(
    store,
    defaultRollingFlightBundleValidator(),
    clockValue,
    [],
    defaultRollingFlightBundleEngine(flagsValue),
  );
}
