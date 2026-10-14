import * as clock from "../../../../kit/clock.js";
import { TieredDeflectionSlotEngine, defaultTieredDeflectionSlotEngine } from "./tiered-deflection-slot-engine.js";
import {
  TieredDeflectionSlotValidator,
  defaultTieredDeflectionSlotValidator,
} from "./tiered-deflection-slot-rules.js";
import { TieredDeflectionSlotStore } from "./tiered-deflection-slot-store.js";

/** Moves tiered deflection slots through their life cycle and keeps a journal of what it did. */
export class TieredDeflectionSlotCoordinator {
  store: TieredDeflectionSlotStore;
  validator: TieredDeflectionSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredDeflectionSlotEngine;

  constructor(
    store: TieredDeflectionSlotStore,
    validator: TieredDeflectionSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredDeflectionSlotEngine,
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
      throw new Error(`tiered deflection slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered deflection slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered deflection slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredDeflectionSlotCoordinator(store: TieredDeflectionSlotStore, clockValue: clock.Clock): TieredDeflectionSlotCoordinator {
  return new TieredDeflectionSlotCoordinator(
    store,
    defaultTieredDeflectionSlotValidator(),
    clockValue,
    [],
    defaultTieredDeflectionSlotEngine(),
  );
}
