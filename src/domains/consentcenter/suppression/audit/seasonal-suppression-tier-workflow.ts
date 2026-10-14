import * as clock from "../../../../kit/clock.js";
import {
  SeasonalSuppressionTierEngine,
  defaultSeasonalSuppressionTierEngine,
} from "./seasonal-suppression-tier-engine.js";
import {
  SeasonalSuppressionTierValidator,
  defaultSeasonalSuppressionTierValidator,
} from "./seasonal-suppression-tier-rules.js";
import { SeasonalSuppressionTierStore } from "./seasonal-suppression-tier-store.js";

/** Moves seasonal suppression tiers through their life cycle and keeps a journal of what it did. */
export class SeasonalSuppressionTierWorkflow {
  store: SeasonalSuppressionTierStore;
  validator: SeasonalSuppressionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalSuppressionTierEngine;

  constructor(
    store: SeasonalSuppressionTierStore,
    validator: SeasonalSuppressionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalSuppressionTierEngine,
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
      throw new Error(`seasonal suppression tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal suppression tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal suppression tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newSeasonalSuppressionTierWorkflow(store: SeasonalSuppressionTierStore, clockValue: clock.Clock): SeasonalSuppressionTierWorkflow {
  return new SeasonalSuppressionTierWorkflow(
    store,
    defaultSeasonalSuppressionTierValidator(),
    clockValue,
    [],
    defaultSeasonalSuppressionTierEngine(),
  );
}
