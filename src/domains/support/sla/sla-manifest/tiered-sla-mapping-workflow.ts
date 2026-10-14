import * as clock from "../../../../kit/clock.js";
import { TieredSlaMappingEngine, defaultTieredSlaMappingEngine } from "./tiered-sla-mapping-engine.js";
import { TieredSlaMappingValidator, defaultTieredSlaMappingValidator } from "./tiered-sla-mapping-rules.js";
import { TieredSlaMappingStore } from "./tiered-sla-mapping-store.js";

/** Moves tiered sla mappings through their life cycle and keeps a journal of what it did. */
export class TieredSlaMappingService {
  store: TieredSlaMappingStore;
  validator: TieredSlaMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredSlaMappingEngine;

  constructor(
    store: TieredSlaMappingStore,
    validator: TieredSlaMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredSlaMappingEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered sla mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered sla mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered sla mapping ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredSlaMappingService(store: TieredSlaMappingStore, clockValue: clock.Clock): TieredSlaMappingService {
  return new TieredSlaMappingService(
    store,
    defaultTieredSlaMappingValidator(),
    clockValue,
    [],
    defaultTieredSlaMappingEngine(),
  );
}
