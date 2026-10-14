import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WarmupRuleEngine, defaultWarmupRuleEngine } from "./warmup-rule-engine.js";
import { WarmupRuleValidator, defaultWarmupRuleValidator } from "./warmup-rule-rules.js";
import { WarmupRuleStore } from "./warmup-rule-store.js";

/** Moves warmup rules through their life cycle and keeps a journal of what it did. */
export class WarmupRuleDesk {
  store: WarmupRuleStore;
  validator: WarmupRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupRuleEngine;

  constructor(
    store: WarmupRuleStore,
    validator: WarmupRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupRuleEngine,
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
      throw new Error(`warmup rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup rule ${code} not found`);
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
      throw new Error(`warmup rule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWarmupRuleDesk(store: WarmupRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): WarmupRuleDesk {
  return new WarmupRuleDesk(store, defaultWarmupRuleValidator(), clockValue, [], defaultWarmupRuleEngine(flagsValue));
}
