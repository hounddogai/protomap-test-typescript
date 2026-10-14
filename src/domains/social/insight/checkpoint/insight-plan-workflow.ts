import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightPlanEngine, defaultInsightPlanEngine } from "./insight-plan-engine.js";
import { InsightPlanValidator, defaultInsightPlanValidator } from "./insight-plan-rules.js";
import { InsightPlanStore } from "./insight-plan-store.js";

/** Moves insight plans through their life cycle and keeps a journal of what it did. */
export class InsightPlanManager {
  store: InsightPlanStore;
  validator: InsightPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightPlanEngine;

  constructor(
    store: InsightPlanStore,
    validator: InsightPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightPlanEngine,
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
      throw new Error(`insight plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight plan ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newInsightPlanManager(store: InsightPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightPlanManager {
  return new InsightPlanManager(
    store,
    defaultInsightPlanValidator(),
    clockValue,
    [],
    defaultInsightPlanEngine(flagsValue),
  );
}
