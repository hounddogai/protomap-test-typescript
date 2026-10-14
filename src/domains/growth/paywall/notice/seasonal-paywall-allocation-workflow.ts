import * as clock from "../../../../kit/clock.js";
import {
  SeasonalPaywallAllocationEngine,
  defaultSeasonalPaywallAllocationEngine,
} from "./seasonal-paywall-allocation-engine.js";
import {
  SeasonalPaywallAllocationValidator,
  defaultSeasonalPaywallAllocationValidator,
} from "./seasonal-paywall-allocation-rules.js";
import { SeasonalPaywallAllocationStore } from "./seasonal-paywall-allocation-store.js";

/** Moves seasonal paywall allocations through their life cycle and keeps a journal of what it did. */
export class SeasonalPaywallAllocationService {
  store: SeasonalPaywallAllocationStore;
  validator: SeasonalPaywallAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPaywallAllocationEngine;

  constructor(
    store: SeasonalPaywallAllocationStore,
    validator: SeasonalPaywallAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPaywallAllocationEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall allocation ${code} not found`);
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
      throw new Error(`seasonal paywall allocation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newSeasonalPaywallAllocationService(store: SeasonalPaywallAllocationStore, clockValue: clock.Clock): SeasonalPaywallAllocationService {
  return new SeasonalPaywallAllocationService(
    store,
    defaultSeasonalPaywallAllocationValidator(),
    clockValue,
    [],
    defaultSeasonalPaywallAllocationEngine(),
  );
}
