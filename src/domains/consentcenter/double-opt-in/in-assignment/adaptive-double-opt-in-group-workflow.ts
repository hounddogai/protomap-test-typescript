import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveDoubleOptInGroupEngine,
  defaultAdaptiveDoubleOptInGroupEngine,
} from "./adaptive-double-opt-in-group-engine.js";
import {
  AdaptiveDoubleOptInGroupValidator,
  defaultAdaptiveDoubleOptInGroupValidator,
} from "./adaptive-double-opt-in-group-rules.js";
import { AdaptiveDoubleOptInGroupStore } from "./adaptive-double-opt-in-group-store.js";

/** Moves adaptive double opt in groups through their life cycle and keeps a journal of what it did. */
export class AdaptiveDoubleOptInGroupService {
  store: AdaptiveDoubleOptInGroupStore;
  validator: AdaptiveDoubleOptInGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDoubleOptInGroupEngine;

  constructor(
    store: AdaptiveDoubleOptInGroupStore,
    validator: AdaptiveDoubleOptInGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDoubleOptInGroupEngine,
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
      throw new Error(`adaptive double opt in group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive double opt in group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive double opt in group ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveDoubleOptInGroupService(store: AdaptiveDoubleOptInGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveDoubleOptInGroupService {
  return new AdaptiveDoubleOptInGroupService(
    store,
    defaultAdaptiveDoubleOptInGroupValidator(),
    clockValue,
    [],
    defaultAdaptiveDoubleOptInGroupEngine(flagsValue),
  );
}
