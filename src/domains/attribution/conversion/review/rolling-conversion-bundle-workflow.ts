import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingConversionBundleEngine,
  defaultRollingConversionBundleEngine,
} from "./rolling-conversion-bundle-engine.js";
import {
  RollingConversionBundleValidator,
  defaultRollingConversionBundleValidator,
} from "./rolling-conversion-bundle-rules.js";
import { RollingConversionBundleStore } from "./rolling-conversion-bundle-store.js";

/** Moves rolling conversion bundles through their life cycle and keeps a journal of what it did. */
export class RollingConversionBundleManager {
  store: RollingConversionBundleStore;
  validator: RollingConversionBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingConversionBundleEngine;

  constructor(
    store: RollingConversionBundleStore,
    validator: RollingConversionBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingConversionBundleEngine,
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
      throw new Error(`rolling conversion bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling conversion bundle ${code} not found`);
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
      throw new Error(`rolling conversion bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRollingConversionBundleManager(store: RollingConversionBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingConversionBundleManager {
  return new RollingConversionBundleManager(
    store,
    defaultRollingConversionBundleValidator(),
    clockValue,
    [],
    defaultRollingConversionBundleEngine(flagsValue),
  );
}
