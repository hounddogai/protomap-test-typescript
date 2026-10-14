import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightQuotaEngine, defaultInsightQuotaEngine } from "./insight-quota-engine.js";
import { InsightQuotaValidator, defaultInsightQuotaValidator } from "./insight-quota-rules.js";
import { InsightQuotaStore } from "./insight-quota-store.js";

/** Moves insight quotas through their life cycle and keeps a journal of what it did. */
export class InsightQuotaWorkflow {
  store: InsightQuotaStore;
  validator: InsightQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightQuotaEngine;

  constructor(
    store: InsightQuotaStore,
    validator: InsightQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightQuotaEngine,
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
      throw new Error(`insight quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight quota ${code} not found`);
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
      throw new Error(`insight quota ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newInsightQuotaWorkflow(store: InsightQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightQuotaWorkflow {
  return new InsightQuotaWorkflow(
    store,
    defaultInsightQuotaValidator(),
    clockValue,
    [],
    defaultInsightQuotaEngine(flagsValue),
  );
}
