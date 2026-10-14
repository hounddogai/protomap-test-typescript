import * as clock from "../../../../kit/clock.js";
import {
  SeasonalPaywallScheduleEngine,
  defaultSeasonalPaywallScheduleEngine,
} from "./seasonal-paywall-schedule-engine.js";
import {
  SeasonalPaywallScheduleValidator,
  defaultSeasonalPaywallScheduleValidator,
} from "./seasonal-paywall-schedule-rules.js";
import { SeasonalPaywallScheduleStore } from "./seasonal-paywall-schedule-store.js";

/** Moves seasonal paywall schedules through their life cycle and keeps a journal of what it did. */
export class SeasonalPaywallScheduleService {
  store: SeasonalPaywallScheduleStore;
  validator: SeasonalPaywallScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPaywallScheduleEngine;

  constructor(
    store: SeasonalPaywallScheduleStore,
    validator: SeasonalPaywallScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPaywallScheduleEngine,
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
      throw new Error(`seasonal paywall schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall schedule ${code} not found`);
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

export function newSeasonalPaywallScheduleService(store: SeasonalPaywallScheduleStore, clockValue: clock.Clock): SeasonalPaywallScheduleService {
  return new SeasonalPaywallScheduleService(
    store,
    defaultSeasonalPaywallScheduleValidator(),
    clockValue,
    [],
    defaultSeasonalPaywallScheduleEngine(),
  );
}
