import * as clock from "../../../../kit/clock.js";
import {
  FallbackInsightSummaryEngine,
  defaultFallbackInsightSummaryEngine,
} from "./fallback-insight-summary-engine.js";
import {
  FallbackInsightSummaryValidator,
  defaultFallbackInsightSummaryValidator,
} from "./fallback-insight-summary-rules.js";
import { FallbackInsightSummaryStore } from "./fallback-insight-summary-store.js";

/** Moves fallback insight summaries through their life cycle and keeps a journal of what it did. */
export class FallbackInsightSummaryService {
  store: FallbackInsightSummaryStore;
  validator: FallbackInsightSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackInsightSummaryEngine;

  constructor(
    store: FallbackInsightSummaryStore,
    validator: FallbackInsightSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackInsightSummaryEngine,
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
      throw new Error(`fallback insight summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback insight summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback insight summary ${code} not found`);
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

export function newFallbackInsightSummaryService(store: FallbackInsightSummaryStore, clockValue: clock.Clock): FallbackInsightSummaryService {
  return new FallbackInsightSummaryService(
    store,
    defaultFallbackInsightSummaryValidator(),
    clockValue,
    [],
    defaultFallbackInsightSummaryEngine(),
  );
}
