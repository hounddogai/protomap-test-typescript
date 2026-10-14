import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyWaitRollupEngine, defaultLegacyWaitRollupEngine } from "./legacy-wait-rollup-engine.js";
import { LegacyWaitRollupValidator, defaultLegacyWaitRollupValidator } from "./legacy-wait-rollup-rules.js";
import { LegacyWaitRollupStore } from "./legacy-wait-rollup-store.js";

/** Moves legacy wait rollups through their life cycle and keeps a journal of what it did. */
export class LegacyWaitRollupService {
  store: LegacyWaitRollupStore;
  validator: LegacyWaitRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyWaitRollupEngine;

  constructor(
    store: LegacyWaitRollupStore,
    validator: LegacyWaitRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyWaitRollupEngine,
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
      throw new Error(`legacy wait rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy wait rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy wait rollup ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacyWaitRollupService(store: LegacyWaitRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyWaitRollupService {
  return new LegacyWaitRollupService(
    store,
    defaultLegacyWaitRollupValidator(),
    clockValue,
    [],
    defaultLegacyWaitRollupEngine(flagsValue),
  );
}
