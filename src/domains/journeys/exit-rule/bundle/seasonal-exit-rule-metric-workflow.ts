import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalExitRuleMetricEngine,
  defaultSeasonalExitRuleMetricEngine,
} from "./seasonal-exit-rule-metric-engine.js";
import {
  SeasonalExitRuleMetricValidator,
  defaultSeasonalExitRuleMetricValidator,
} from "./seasonal-exit-rule-metric-rules.js";
import { SeasonalExitRuleMetricStore } from "./seasonal-exit-rule-metric-store.js";

/** Moves seasonal exit rule metrics through their life cycle and keeps a journal of what it did. */
export class SeasonalExitRuleMetricManager {
  store: SeasonalExitRuleMetricStore;
  validator: SeasonalExitRuleMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalExitRuleMetricEngine;

  constructor(
    store: SeasonalExitRuleMetricStore,
    validator: SeasonalExitRuleMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalExitRuleMetricEngine,
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
      throw new Error(`seasonal exit rule metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal exit rule metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal exit rule metric ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalExitRuleMetricManager(store: SeasonalExitRuleMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalExitRuleMetricManager {
  return new SeasonalExitRuleMetricManager(
    store,
    defaultSeasonalExitRuleMetricValidator(),
    clockValue,
    [],
    defaultSeasonalExitRuleMetricEngine(flagsValue),
  );
}
