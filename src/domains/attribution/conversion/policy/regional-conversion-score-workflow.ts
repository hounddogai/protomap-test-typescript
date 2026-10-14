import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalConversionScoreEngine,
  defaultRegionalConversionScoreEngine,
} from "./regional-conversion-score-engine.js";
import {
  RegionalConversionScoreValidator,
  defaultRegionalConversionScoreValidator,
} from "./regional-conversion-score-rules.js";
import { RegionalConversionScoreStore } from "./regional-conversion-score-store.js";

/** Moves regional conversion scores through their life cycle and keeps a journal of what it did. */
export class RegionalConversionScoreManager {
  store: RegionalConversionScoreStore;
  validator: RegionalConversionScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalConversionScoreEngine;

  constructor(
    store: RegionalConversionScoreStore,
    validator: RegionalConversionScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalConversionScoreEngine,
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
      throw new Error(`regional conversion score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional conversion score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional conversion score ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalConversionScoreManager(store: RegionalConversionScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalConversionScoreManager {
  return new RegionalConversionScoreManager(
    store,
    defaultRegionalConversionScoreValidator(),
    clockValue,
    [],
    defaultRegionalConversionScoreEngine(flagsValue),
  );
}
