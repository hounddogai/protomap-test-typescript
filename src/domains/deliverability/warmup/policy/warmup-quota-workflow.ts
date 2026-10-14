import * as clock from "../../../../kit/clock.js";
import { WarmupQuotaEngine, defaultWarmupQuotaEngine } from "./warmup-quota-engine.js";
import { WarmupQuotaValidator, defaultWarmupQuotaValidator } from "./warmup-quota-rules.js";
import { WarmupQuotaStore } from "./warmup-quota-store.js";

/** Moves warmup quotas through their life cycle and keeps a journal of what it did. */
export class WarmupQuotaDesk {
  store: WarmupQuotaStore;
  validator: WarmupQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupQuotaEngine;

  constructor(
    store: WarmupQuotaStore,
    validator: WarmupQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupQuotaEngine,
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
      throw new Error(`warmup quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup quota ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWarmupQuotaDesk(store: WarmupQuotaStore, clockValue: clock.Clock): WarmupQuotaDesk {
  return new WarmupQuotaDesk(store, defaultWarmupQuotaValidator(), clockValue, [], defaultWarmupQuotaEngine());
}
