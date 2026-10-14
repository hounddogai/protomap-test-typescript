import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BidRuleScheduleEngine, defaultBidRuleScheduleEngine } from "./bid-rule-schedule-engine.js";
import { BidRuleScheduleValidator, defaultBidRuleScheduleValidator } from "./bid-rule-schedule-rules.js";
import { BidRuleScheduleStore } from "./bid-rule-schedule-store.js";

/** Moves bid rule schedules through their life cycle and keeps a journal of what it did. */
export class BidRuleScheduleDesk {
  store: BidRuleScheduleStore;
  validator: BidRuleScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleScheduleEngine;

  constructor(
    store: BidRuleScheduleStore,
    validator: BidRuleScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleScheduleEngine,
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
      throw new Error(`bid rule schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule schedule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBidRuleScheduleDesk(store: BidRuleScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): BidRuleScheduleDesk {
  return new BidRuleScheduleDesk(
    store,
    defaultBidRuleScheduleValidator(),
    clockValue,
    [],
    defaultBidRuleScheduleEngine(flagsValue),
  );
}
