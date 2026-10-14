import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalPreferenceRollupEngine,
  defaultGlobalPreferenceRollupEngine,
} from "./global-preference-rollup-engine.js";
import {
  GlobalPreferenceRollupValidator,
  defaultGlobalPreferenceRollupValidator,
} from "./global-preference-rollup-rules.js";
import { GlobalPreferenceRollupStore } from "./global-preference-rollup-store.js";

/** Moves global preference rollups through their life cycle and keeps a journal of what it did. */
export class GlobalPreferenceRollupManager {
  store: GlobalPreferenceRollupStore;
  validator: GlobalPreferenceRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalPreferenceRollupEngine;

  constructor(
    store: GlobalPreferenceRollupStore,
    validator: GlobalPreferenceRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalPreferenceRollupEngine,
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
      throw new Error(`global preference rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global preference rollup ${code} not found`);
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
      throw new Error(`global preference rollup ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newGlobalPreferenceRollupManager(store: GlobalPreferenceRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalPreferenceRollupManager {
  return new GlobalPreferenceRollupManager(
    store,
    defaultGlobalPreferenceRollupValidator(),
    clockValue,
    [],
    defaultGlobalPreferenceRollupEngine(flagsValue),
  );
}
