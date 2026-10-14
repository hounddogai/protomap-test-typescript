import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BidRuleForecastEngine, defaultBidRuleForecastEngine } from "./bid-rule-forecast-engine.js";
import { BidRuleForecastValidator, defaultBidRuleForecastValidator } from "./bid-rule-forecast-rules.js";
import { BidRuleForecastStore } from "./bid-rule-forecast-store.js";

/** Moves bid rule forecasts through their life cycle and keeps a journal of what it did. */
export class BidRuleForecastManager {
  store: BidRuleForecastStore;
  validator: BidRuleForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleForecastEngine;

  constructor(
    store: BidRuleForecastStore,
    validator: BidRuleForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleForecastEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule forecast ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBidRuleForecastManager(store: BidRuleForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): BidRuleForecastManager {
  return new BidRuleForecastManager(
    store,
    defaultBidRuleForecastValidator(),
    clockValue,
    [],
    defaultBidRuleForecastEngine(flagsValue),
  );
}
