import * as clock from "../../../../kit/clock.js";
import { TieredCsatMappingEngine, defaultTieredCsatMappingEngine } from "./tiered-csat-mapping-engine.js";
import { TieredCsatMappingValidator, defaultTieredCsatMappingValidator } from "./tiered-csat-mapping-rules.js";
import { TieredCsatMappingStore } from "./tiered-csat-mapping-store.js";

/** Moves tiered csat mappings through their life cycle and keeps a journal of what it did. */
export class TieredCsatMappingWorkflow {
  store: TieredCsatMappingStore;
  validator: TieredCsatMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredCsatMappingEngine;

  constructor(
    store: TieredCsatMappingStore,
    validator: TieredCsatMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredCsatMappingEngine,
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
      throw new Error(`tiered csat mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered csat mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered csat mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newTieredCsatMappingWorkflow(store: TieredCsatMappingStore, clockValue: clock.Clock): TieredCsatMappingWorkflow {
  return new TieredCsatMappingWorkflow(
    store,
    defaultTieredCsatMappingValidator(),
    clockValue,
    [],
    defaultTieredCsatMappingEngine(),
  );
}
