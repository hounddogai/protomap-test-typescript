import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalPacingVarianceEngine,
  defaultRegionalPacingVarianceEngine,
} from "./regional-pacing-variance-engine.js";
import {
  RegionalPacingVarianceValidator,
  defaultRegionalPacingVarianceValidator,
} from "./regional-pacing-variance-rules.js";
import { RegionalPacingVarianceStore } from "./regional-pacing-variance-store.js";

/** Moves regional pacing variances through their life cycle and keeps a journal of what it did. */
export class RegionalPacingVarianceCoordinator {
  store: RegionalPacingVarianceStore;
  validator: RegionalPacingVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalPacingVarianceEngine;

  constructor(
    store: RegionalPacingVarianceStore,
    validator: RegionalPacingVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalPacingVarianceEngine,
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
      throw new Error(`regional pacing variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional pacing variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional pacing variance ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalPacingVarianceCoordinator(store: RegionalPacingVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalPacingVarianceCoordinator {
  return new RegionalPacingVarianceCoordinator(
    store,
    defaultRegionalPacingVarianceValidator(),
    clockValue,
    [],
    defaultRegionalPacingVarianceEngine(flagsValue),
  );
}
