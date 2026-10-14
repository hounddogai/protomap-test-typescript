import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveWarmupBudgetEngine, defaultAdaptiveWarmupBudgetEngine } from "./adaptive-warmup-budget-engine.js";
import {
  AdaptiveWarmupBudgetValidator,
  defaultAdaptiveWarmupBudgetValidator,
} from "./adaptive-warmup-budget-rules.js";
import { AdaptiveWarmupBudgetStore } from "./adaptive-warmup-budget-store.js";

/** Moves adaptive warmup budgets through their life cycle and keeps a journal of what it did. */
export class AdaptiveWarmupBudgetService {
  store: AdaptiveWarmupBudgetStore;
  validator: AdaptiveWarmupBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveWarmupBudgetEngine;

  constructor(
    store: AdaptiveWarmupBudgetStore,
    validator: AdaptiveWarmupBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveWarmupBudgetEngine,
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
      throw new Error(`adaptive warmup budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive warmup budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive warmup budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptiveWarmupBudgetService(store: AdaptiveWarmupBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveWarmupBudgetService {
  return new AdaptiveWarmupBudgetService(
    store,
    defaultAdaptiveWarmupBudgetValidator(),
    clockValue,
    [],
    defaultAdaptiveWarmupBudgetEngine(flagsValue),
  );
}
