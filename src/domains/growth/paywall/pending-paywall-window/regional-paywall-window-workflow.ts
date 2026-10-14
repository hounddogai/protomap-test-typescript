import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalPaywallWindowEngine, defaultRegionalPaywallWindowEngine } from "./regional-paywall-window-engine.js";
import {
  RegionalPaywallWindowValidator,
  defaultRegionalPaywallWindowValidator,
} from "./regional-paywall-window-rules.js";
import { RegionalPaywallWindowStore } from "./regional-paywall-window-store.js";

/** Moves regional paywall windows through their life cycle and keeps a journal of what it did. */
export class RegionalPaywallWindowCoordinator {
  store: RegionalPaywallWindowStore;
  validator: RegionalPaywallWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalPaywallWindowEngine;

  constructor(
    store: RegionalPaywallWindowStore,
    validator: RegionalPaywallWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalPaywallWindowEngine,
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
      throw new Error(`regional paywall window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional paywall window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional paywall window ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRegionalPaywallWindowCoordinator(store: RegionalPaywallWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalPaywallWindowCoordinator {
  return new RegionalPaywallWindowCoordinator(
    store,
    defaultRegionalPaywallWindowValidator(),
    clockValue,
    [],
    defaultRegionalPaywallWindowEngine(flagsValue),
  );
}
