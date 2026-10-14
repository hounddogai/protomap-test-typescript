import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WarmupSummaryEngine, defaultWarmupSummaryEngine } from "./warmup-summary-engine.js";
import { WarmupSummaryValidator, defaultWarmupSummaryValidator } from "./warmup-summary-rules.js";
import { WarmupSummaryStore } from "./warmup-summary-store.js";

/** Moves warmup summaries through their life cycle and keeps a journal of what it did. */
export class WarmupSummaryDesk {
  store: WarmupSummaryStore;
  validator: WarmupSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupSummaryEngine;

  constructor(
    store: WarmupSummaryStore,
    validator: WarmupSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupSummaryEngine,
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
      throw new Error(`warmup summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup summary ${code} not found`);
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
      throw new Error(`warmup summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newWarmupSummaryDesk(store: WarmupSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): WarmupSummaryDesk {
  return new WarmupSummaryDesk(
    store,
    defaultWarmupSummaryValidator(),
    clockValue,
    [],
    defaultWarmupSummaryEngine(flagsValue),
  );
}
