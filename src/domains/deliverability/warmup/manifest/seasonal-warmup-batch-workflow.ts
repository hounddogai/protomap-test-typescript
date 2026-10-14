import * as clock from "../../../../kit/clock.js";
import { SeasonalWarmupBatchValidator, defaultSeasonalWarmupBatchValidator } from "./seasonal-warmup-batch-rules.js";
import { SeasonalWarmupBatchStore } from "./seasonal-warmup-batch-store.js";

/** Moves seasonal warmup batches through their life cycle and keeps a journal of what it did. */
export class SeasonalWarmupBatchCoordinator {
  store: SeasonalWarmupBatchStore;
  validator: SeasonalWarmupBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalWarmupBatchStore,
    validator: SeasonalWarmupBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal warmup batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal warmup batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newSeasonalWarmupBatchCoordinator(store: SeasonalWarmupBatchStore, clockValue: clock.Clock): SeasonalWarmupBatchCoordinator {
  return new SeasonalWarmupBatchCoordinator(store, defaultSeasonalWarmupBatchValidator(), clockValue, []);
}
