import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedWaitQuotaEngine, defaultWeightedWaitQuotaEngine } from "./weighted-wait-quota-engine.js";
import { WeightedWaitQuotaValidator, defaultWeightedWaitQuotaValidator } from "./weighted-wait-quota-rules.js";
import { WeightedWaitQuotaStore } from "./weighted-wait-quota-store.js";

/** Moves weighted wait quotas through their life cycle and keeps a journal of what it did. */
export class WeightedWaitQuotaDesk {
  store: WeightedWaitQuotaStore;
  validator: WeightedWaitQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedWaitQuotaEngine;

  constructor(
    store: WeightedWaitQuotaStore,
    validator: WeightedWaitQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedWaitQuotaEngine,
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
      throw new Error(`weighted wait quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted wait quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted wait quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newWeightedWaitQuotaDesk(store: WeightedWaitQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedWaitQuotaDesk {
  return new WeightedWaitQuotaDesk(
    store,
    defaultWeightedWaitQuotaValidator(),
    clockValue,
    [],
    defaultWeightedWaitQuotaEngine(flagsValue),
  );
}
