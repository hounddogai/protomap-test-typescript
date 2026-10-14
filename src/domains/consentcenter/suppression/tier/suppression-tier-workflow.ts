import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SuppressionTierEngine, defaultSuppressionTierEngine } from "./suppression-tier-engine.js";
import { SuppressionTierValidator, defaultSuppressionTierValidator } from "./suppression-tier-rules.js";
import { SuppressionTierStore } from "./suppression-tier-store.js";

/** Moves suppression tiers through their life cycle and keeps a journal of what it did. */
export class SuppressionTierManager {
  store: SuppressionTierStore;
  validator: SuppressionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SuppressionTierEngine;

  constructor(
    store: SuppressionTierStore,
    validator: SuppressionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SuppressionTierEngine,
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
      throw new Error(`suppression tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSuppressionTierManager(store: SuppressionTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): SuppressionTierManager {
  return new SuppressionTierManager(
    store,
    defaultSuppressionTierValidator(),
    clockValue,
    [],
    defaultSuppressionTierEngine(flagsValue),
  );
}
