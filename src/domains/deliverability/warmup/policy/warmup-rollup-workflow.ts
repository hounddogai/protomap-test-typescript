import * as clock from "../../../../kit/clock.js";
import { WarmupRollupEngine, defaultWarmupRollupEngine } from "./warmup-rollup-engine.js";
import { WarmupRollupValidator, defaultWarmupRollupValidator } from "./warmup-rollup-rules.js";
import { WarmupRollupStore } from "./warmup-rollup-store.js";

/** Moves warmup rollups through their life cycle and keeps a journal of what it did. */
export class WarmupRollupWorkflow {
  store: WarmupRollupStore;
  validator: WarmupRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupRollupEngine;

  constructor(
    store: WarmupRollupStore,
    validator: WarmupRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupRollupEngine,
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
      throw new Error(`warmup rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup rollup ${code} not found`);
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
      throw new Error(`warmup rollup ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWarmupRollupWorkflow(store: WarmupRollupStore, clockValue: clock.Clock): WarmupRollupWorkflow {
  return new WarmupRollupWorkflow(store, defaultWarmupRollupValidator(), clockValue, [], defaultWarmupRollupEngine());
}
