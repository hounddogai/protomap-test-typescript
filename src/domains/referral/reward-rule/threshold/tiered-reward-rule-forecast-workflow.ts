import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredRewardRuleForecastEngine,
  defaultTieredRewardRuleForecastEngine,
} from "./tiered-reward-rule-forecast-engine.js";
import {
  TieredRewardRuleForecastValidator,
  defaultTieredRewardRuleForecastValidator,
} from "./tiered-reward-rule-forecast-rules.js";
import { TieredRewardRuleForecastStore } from "./tiered-reward-rule-forecast-store.js";

/** Moves tiered reward rule forecasts through their life cycle and keeps a journal of what it did. */
export class TieredRewardRuleForecastDesk {
  store: TieredRewardRuleForecastStore;
  validator: TieredRewardRuleForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredRewardRuleForecastEngine;

  constructor(
    store: TieredRewardRuleForecastStore,
    validator: TieredRewardRuleForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredRewardRuleForecastEngine,
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
      throw new Error(`tiered reward rule forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward rule forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward rule forecast ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTieredRewardRuleForecastDesk(store: TieredRewardRuleForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredRewardRuleForecastDesk {
  return new TieredRewardRuleForecastDesk(
    store,
    defaultTieredRewardRuleForecastValidator(),
    clockValue,
    [],
    defaultTieredRewardRuleForecastEngine(flagsValue),
  );
}
