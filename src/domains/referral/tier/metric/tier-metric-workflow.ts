import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TierMetricEngine, defaultTierMetricEngine } from "./tier-metric-engine.js";
import { TierMetricValidator, defaultTierMetricValidator } from "./tier-metric-rules.js";
import { TierMetricStore } from "./tier-metric-store.js";

/** Moves tier metrics through their life cycle and keeps a journal of what it did. */
export class TierMetricService {
  store: TierMetricStore;
  validator: TierMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierMetricEngine;

  constructor(
    store: TierMetricStore,
    validator: TierMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierMetricEngine,
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
      throw new Error(`tier metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier metric ${code} not found`);
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
      throw new Error(`tier metric ${code} not found`);
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

export function newTierMetricService(store: TierMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): TierMetricService {
  return new TierMetricService(
    store,
    defaultTierMetricValidator(),
    clockValue,
    [],
    defaultTierMetricEngine(flagsValue),
  );
}
