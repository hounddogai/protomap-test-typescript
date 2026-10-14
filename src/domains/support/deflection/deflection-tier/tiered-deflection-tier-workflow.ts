import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredDeflectionTierEngine, defaultTieredDeflectionTierEngine } from "./tiered-deflection-tier-engine.js";
import {
  TieredDeflectionTierValidator,
  defaultTieredDeflectionTierValidator,
} from "./tiered-deflection-tier-rules.js";
import { TieredDeflectionTierStore } from "./tiered-deflection-tier-store.js";

/** Moves tiered deflection tiers through their life cycle and keeps a journal of what it did. */
export class TieredDeflectionTierManager {
  store: TieredDeflectionTierStore;
  validator: TieredDeflectionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredDeflectionTierEngine;

  constructor(
    store: TieredDeflectionTierStore,
    validator: TieredDeflectionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredDeflectionTierEngine,
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
      throw new Error(`tiered deflection tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered deflection tier ${code} not found`);
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
      throw new Error(`tiered deflection tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newTieredDeflectionTierManager(store: TieredDeflectionTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredDeflectionTierManager {
  return new TieredDeflectionTierManager(
    store,
    defaultTieredDeflectionTierValidator(),
    clockValue,
    [],
    defaultTieredDeflectionTierEngine(flagsValue),
  );
}
