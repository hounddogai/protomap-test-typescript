import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightMappingEngine, defaultInsightMappingEngine } from "./insight-mapping-engine.js";
import { InsightMappingValidator, defaultInsightMappingValidator } from "./insight-mapping-rules.js";
import { InsightMappingStore } from "./insight-mapping-store.js";

/** Moves insight mappings through their life cycle and keeps a journal of what it did. */
export class InsightMappingWorkflow {
  store: InsightMappingStore;
  validator: InsightMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightMappingEngine;

  constructor(
    store: InsightMappingStore,
    validator: InsightMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightMappingEngine,
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
      throw new Error(`insight mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight mapping ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newInsightMappingWorkflow(store: InsightMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightMappingWorkflow {
  return new InsightMappingWorkflow(
    store,
    defaultInsightMappingValidator(),
    clockValue,
    [],
    defaultInsightMappingEngine(flagsValue),
  );
}
