import * as clock from "../../../../kit/clock.js";
import {
  LenientPreferenceRollupEngine,
  defaultLenientPreferenceRollupEngine,
} from "./lenient-preference-rollup-engine.js";
import {
  LenientPreferenceRollupValidator,
  defaultLenientPreferenceRollupValidator,
} from "./lenient-preference-rollup-rules.js";
import { LenientPreferenceRollupStore } from "./lenient-preference-rollup-store.js";

/** Moves lenient preference rollups through their life cycle and keeps a journal of what it did. */
export class LenientPreferenceRollupManager {
  store: LenientPreferenceRollupStore;
  validator: LenientPreferenceRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPreferenceRollupEngine;

  constructor(
    store: LenientPreferenceRollupStore,
    validator: LenientPreferenceRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPreferenceRollupEngine,
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
      throw new Error(`lenient preference rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient preference rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient preference rollup ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientPreferenceRollupManager(store: LenientPreferenceRollupStore, clockValue: clock.Clock): LenientPreferenceRollupManager {
  return new LenientPreferenceRollupManager(
    store,
    defaultLenientPreferenceRollupValidator(),
    clockValue,
    [],
    defaultLenientPreferenceRollupEngine(),
  );
}
