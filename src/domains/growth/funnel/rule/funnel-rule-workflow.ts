import * as clock from "../../../../kit/clock.js";
import { FunnelRuleEngine, defaultFunnelRuleEngine } from "./funnel-rule-engine.js";
import { FunnelRuleValidator, defaultFunnelRuleValidator } from "./funnel-rule-rules.js";
import { FunnelRuleStore } from "./funnel-rule-store.js";

/** Moves funnel rules through their life cycle and keeps a journal of what it did. */
export class FunnelRuleManager {
  store: FunnelRuleStore;
  validator: FunnelRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelRuleEngine;

  constructor(
    store: FunnelRuleStore,
    validator: FunnelRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelRuleEngine,
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
      throw new Error(`funnel rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel rule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFunnelRuleManager(store: FunnelRuleStore, clockValue: clock.Clock): FunnelRuleManager {
  return new FunnelRuleManager(store, defaultFunnelRuleValidator(), clockValue, [], defaultFunnelRuleEngine());
}
