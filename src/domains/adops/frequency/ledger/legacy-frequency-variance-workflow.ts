import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyFrequencyVarianceEngine,
  defaultLegacyFrequencyVarianceEngine,
} from "./legacy-frequency-variance-engine.js";
import {
  LegacyFrequencyVarianceValidator,
  defaultLegacyFrequencyVarianceValidator,
} from "./legacy-frequency-variance-rules.js";
import { LegacyFrequencyVarianceStore } from "./legacy-frequency-variance-store.js";

/** Moves legacy frequency variances through their life cycle and keeps a journal of what it did. */
export class LegacyFrequencyVarianceCoordinator {
  store: LegacyFrequencyVarianceStore;
  validator: LegacyFrequencyVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyFrequencyVarianceEngine;

  constructor(
    store: LegacyFrequencyVarianceStore,
    validator: LegacyFrequencyVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyFrequencyVarianceEngine,
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
      throw new Error(`legacy frequency variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy frequency variance ${code} not found`);
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
      throw new Error(`legacy frequency variance ${code} not found`);
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

export function newLegacyFrequencyVarianceCoordinator(store: LegacyFrequencyVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyFrequencyVarianceCoordinator {
  return new LegacyFrequencyVarianceCoordinator(
    store,
    defaultLegacyFrequencyVarianceValidator(),
    clockValue,
    [],
    defaultLegacyFrequencyVarianceEngine(flagsValue),
  );
}
