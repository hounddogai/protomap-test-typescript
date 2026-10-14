import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalInsightScoreEngine, defaultRegionalInsightScoreEngine } from "./regional-insight-score-engine.js";
import {
  RegionalInsightScoreValidator,
  defaultRegionalInsightScoreValidator,
} from "./regional-insight-score-rules.js";
import { RegionalInsightScoreStore } from "./regional-insight-score-store.js";

/** Moves regional insight scores through their life cycle and keeps a journal of what it did. */
export class RegionalInsightScoreDesk {
  store: RegionalInsightScoreStore;
  validator: RegionalInsightScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalInsightScoreEngine;

  constructor(
    store: RegionalInsightScoreStore,
    validator: RegionalInsightScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalInsightScoreEngine,
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
      throw new Error(`regional insight score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional insight score ${code} not found`);
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
      throw new Error(`regional insight score ${code} not found`);
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

export function newRegionalInsightScoreDesk(store: RegionalInsightScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalInsightScoreDesk {
  return new RegionalInsightScoreDesk(
    store,
    defaultRegionalInsightScoreValidator(),
    clockValue,
    [],
    defaultRegionalInsightScoreEngine(flagsValue),
  );
}
