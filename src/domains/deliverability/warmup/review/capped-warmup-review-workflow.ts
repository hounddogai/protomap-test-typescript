import * as clock from "../../../../kit/clock.js";
import { CappedWarmupReviewValidator, defaultCappedWarmupReviewValidator } from "./capped-warmup-review-rules.js";
import { CappedWarmupReviewStore } from "./capped-warmup-review-store.js";

/** Moves capped warmup reviews through their life cycle and keeps a journal of what it did. */
export class CappedWarmupReviewService {
  store: CappedWarmupReviewStore;
  validator: CappedWarmupReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedWarmupReviewStore,
    validator: CappedWarmupReviewValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped warmup review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped warmup review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newCappedWarmupReviewService(store: CappedWarmupReviewStore, clockValue: clock.Clock): CappedWarmupReviewService {
  return new CappedWarmupReviewService(store, defaultCappedWarmupReviewValidator(), clockValue, []);
}
