import * as clock from "../../../../kit/clock.js";
import { FallbackSlaSummaryEngine, defaultFallbackSlaSummaryEngine } from "./fallback-sla-summary-engine.js";
import { FallbackSlaSummaryValidator, defaultFallbackSlaSummaryValidator } from "./fallback-sla-summary-rules.js";
import { FallbackSlaSummaryStore } from "./fallback-sla-summary-store.js";

/** Moves fallback sla summaries through their life cycle and keeps a journal of what it did. */
export class FallbackSlaSummaryManager {
  store: FallbackSlaSummaryStore;
  validator: FallbackSlaSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackSlaSummaryEngine;

  constructor(
    store: FallbackSlaSummaryStore,
    validator: FallbackSlaSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackSlaSummaryEngine,
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
      throw new Error(`fallback sla summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback sla summary ${code} not found`);
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
      throw new Error(`fallback sla summary ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackSlaSummaryManager(store: FallbackSlaSummaryStore, clockValue: clock.Clock): FallbackSlaSummaryManager {
  return new FallbackSlaSummaryManager(
    store,
    defaultFallbackSlaSummaryValidator(),
    clockValue,
    [],
    defaultFallbackSlaSummaryEngine(),
  );
}
