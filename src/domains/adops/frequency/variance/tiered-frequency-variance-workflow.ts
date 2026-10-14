import * as clock from "../../../../kit/clock.js";
import {
  TieredFrequencyVarianceEngine,
  defaultTieredFrequencyVarianceEngine,
} from "./tiered-frequency-variance-engine.js";
import {
  TieredFrequencyVarianceValidator,
  defaultTieredFrequencyVarianceValidator,
} from "./tiered-frequency-variance-rules.js";
import { TieredFrequencyVarianceStore } from "./tiered-frequency-variance-store.js";

/** Moves tiered frequency variances through their life cycle and keeps a journal of what it did. */
export class TieredFrequencyVarianceCoordinator {
  store: TieredFrequencyVarianceStore;
  validator: TieredFrequencyVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredFrequencyVarianceEngine;

  constructor(
    store: TieredFrequencyVarianceStore,
    validator: TieredFrequencyVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredFrequencyVarianceEngine,
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
      throw new Error(`tiered frequency variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered frequency variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered frequency variance ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newTieredFrequencyVarianceCoordinator(store: TieredFrequencyVarianceStore, clockValue: clock.Clock): TieredFrequencyVarianceCoordinator {
  return new TieredFrequencyVarianceCoordinator(
    store,
    defaultTieredFrequencyVarianceValidator(),
    clockValue,
    [],
    defaultTieredFrequencyVarianceEngine(),
  );
}
