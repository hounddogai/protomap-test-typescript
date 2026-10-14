import * as clock from "../../../../kit/clock.js";
import { NudgePlanEngine, defaultNudgePlanEngine } from "./nudge-plan-engine.js";
import { NudgePlanValidator, defaultNudgePlanValidator } from "./nudge-plan-rules.js";
import { NudgePlanStore } from "./nudge-plan-store.js";

/** Moves nudge plans through their life cycle and keeps a journal of what it did. */
export class NudgePlanDesk {
  store: NudgePlanStore;
  validator: NudgePlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgePlanEngine;

  constructor(
    store: NudgePlanStore,
    validator: NudgePlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgePlanEngine,
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
      throw new Error(`nudge plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge plan ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newNudgePlanDesk(store: NudgePlanStore, clockValue: clock.Clock): NudgePlanDesk {
  return new NudgePlanDesk(store, defaultNudgePlanValidator(), clockValue, [], defaultNudgePlanEngine());
}
