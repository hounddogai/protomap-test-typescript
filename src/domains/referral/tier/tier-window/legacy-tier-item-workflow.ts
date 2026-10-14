import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyTierItemEngine, defaultLegacyTierItemEngine } from "./legacy-tier-item-engine.js";
import { LegacyTierItemValidator, defaultLegacyTierItemValidator } from "./legacy-tier-item-rules.js";
import { LegacyTierItemStore } from "./legacy-tier-item-store.js";

/** Moves legacy tier items through their life cycle and keeps a journal of what it did. */
export class LegacyTierItemWorkflow {
  store: LegacyTierItemStore;
  validator: LegacyTierItemValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyTierItemEngine;

  constructor(
    store: LegacyTierItemStore,
    validator: LegacyTierItemValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyTierItemEngine,
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
      throw new Error(`legacy tier item ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy tier item ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy tier item ${code} not found`);
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

export function newLegacyTierItemWorkflow(store: LegacyTierItemStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyTierItemWorkflow {
  return new LegacyTierItemWorkflow(
    store,
    defaultLegacyTierItemValidator(),
    clockValue,
    [],
    defaultLegacyTierItemEngine(flagsValue),
  );
}
