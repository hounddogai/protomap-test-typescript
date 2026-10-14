import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PaywallMilestoneEngine, defaultPaywallMilestoneEngine } from "./paywall-milestone-engine.js";
import { PaywallMilestoneValidator, defaultPaywallMilestoneValidator } from "./paywall-milestone-rules.js";
import { PaywallMilestoneStore } from "./paywall-milestone-store.js";

/** Moves paywall milestones through their life cycle and keeps a journal of what it did. */
export class PaywallMilestoneCoordinator {
  store: PaywallMilestoneStore;
  validator: PaywallMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallMilestoneEngine;

  constructor(
    store: PaywallMilestoneStore,
    validator: PaywallMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallMilestoneEngine,
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
      throw new Error(`paywall milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall milestone ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPaywallMilestoneCoordinator(store: PaywallMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): PaywallMilestoneCoordinator {
  return new PaywallMilestoneCoordinator(
    store,
    defaultPaywallMilestoneValidator(),
    clockValue,
    [],
    defaultPaywallMilestoneEngine(flagsValue),
  );
}
