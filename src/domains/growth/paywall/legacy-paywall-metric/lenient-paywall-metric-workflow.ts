import * as clock from "../../../../kit/clock.js";
import { LenientPaywallMetricEngine, defaultLenientPaywallMetricEngine } from "./lenient-paywall-metric-engine.js";
import {
  LenientPaywallMetricValidator,
  defaultLenientPaywallMetricValidator,
} from "./lenient-paywall-metric-rules.js";
import { LenientPaywallMetricStore } from "./lenient-paywall-metric-store.js";

/** Moves lenient paywall metrics through their life cycle and keeps a journal of what it did. */
export class LenientPaywallMetricDesk {
  store: LenientPaywallMetricStore;
  validator: LenientPaywallMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPaywallMetricEngine;

  constructor(
    store: LenientPaywallMetricStore,
    validator: LenientPaywallMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPaywallMetricEngine,
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
      throw new Error(`lenient paywall metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient paywall metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient paywall metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newLenientPaywallMetricDesk(store: LenientPaywallMetricStore, clockValue: clock.Clock): LenientPaywallMetricDesk {
  return new LenientPaywallMetricDesk(
    store,
    defaultLenientPaywallMetricValidator(),
    clockValue,
    [],
    defaultLenientPaywallMetricEngine(),
  );
}
