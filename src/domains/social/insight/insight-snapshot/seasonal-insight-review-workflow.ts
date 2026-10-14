import * as clock from "../../../../kit/clock.js";
import {
  SeasonalInsightReviewValidator,
  defaultSeasonalInsightReviewValidator,
} from "./seasonal-insight-review-rules.js";
import { SeasonalInsightReviewStore } from "./seasonal-insight-review-store.js";

/** Moves seasonal insight reviews through their life cycle and keeps a journal of what it did. */
export class SeasonalInsightReviewService {
  store: SeasonalInsightReviewStore;
  validator: SeasonalInsightReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalInsightReviewStore,
    validator: SeasonalInsightReviewValidator,
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
      throw new Error(`seasonal insight review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal insight review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newSeasonalInsightReviewService(store: SeasonalInsightReviewStore, clockValue: clock.Clock): SeasonalInsightReviewService {
  return new SeasonalInsightReviewService(store, defaultSeasonalInsightReviewValidator(), clockValue, []);
}
