import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SeasonalCsatTemplateEngine, defaultSeasonalCsatTemplateEngine } from "./seasonal-csat-template-engine.js";
import {
  SeasonalCsatTemplateValidator,
  defaultSeasonalCsatTemplateValidator,
} from "./seasonal-csat-template-rules.js";
import { SeasonalCsatTemplateStore } from "./seasonal-csat-template-store.js";

/** Moves seasonal csat templates through their life cycle and keeps a journal of what it did. */
export class SeasonalCsatTemplateWorkflow {
  store: SeasonalCsatTemplateStore;
  validator: SeasonalCsatTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalCsatTemplateEngine;

  constructor(
    store: SeasonalCsatTemplateStore,
    validator: SeasonalCsatTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalCsatTemplateEngine,
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
      throw new Error(`seasonal csat template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal csat template ${code} not found`);
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
      throw new Error(`seasonal csat template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSeasonalCsatTemplateWorkflow(store: SeasonalCsatTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalCsatTemplateWorkflow {
  return new SeasonalCsatTemplateWorkflow(
    store,
    defaultSeasonalCsatTemplateValidator(),
    clockValue,
    [],
    defaultSeasonalCsatTemplateEngine(flagsValue),
  );
}
