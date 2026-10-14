import * as clock from "../../../../kit/clock.js";
import { WaitMilestoneEngine, defaultWaitMilestoneEngine } from "./wait-milestone-engine.js";
import { WaitMilestoneValidator, defaultWaitMilestoneValidator } from "./wait-milestone-rules.js";
import { WaitMilestoneStore } from "./wait-milestone-store.js";

/** Moves wait milestones through their life cycle and keeps a journal of what it did. */
export class WaitMilestoneService {
  store: WaitMilestoneStore;
  validator: WaitMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitMilestoneEngine;

  constructor(
    store: WaitMilestoneStore,
    validator: WaitMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitMilestoneEngine,
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
      throw new Error(`wait milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait milestone ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newWaitMilestoneService(store: WaitMilestoneStore, clockValue: clock.Clock): WaitMilestoneService {
  return new WaitMilestoneService(store, defaultWaitMilestoneValidator(), clockValue, [], defaultWaitMilestoneEngine());
}
