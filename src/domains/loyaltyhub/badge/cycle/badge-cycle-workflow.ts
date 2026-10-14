import * as clock from "../../../../kit/clock.js";
import { BadgeCycleEngine, defaultBadgeCycleEngine } from "./badge-cycle-engine.js";
import { BadgeCycleValidator, defaultBadgeCycleValidator } from "./badge-cycle-rules.js";
import { BadgeCycleStore } from "./badge-cycle-store.js";

/** Moves badge cycles through their life cycle and keeps a journal of what it did. */
export class BadgeCycleWorkflow {
  store: BadgeCycleStore;
  validator: BadgeCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeCycleEngine;

  constructor(
    store: BadgeCycleStore,
    validator: BadgeCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeCycleEngine,
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
      throw new Error(`badge cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge cycle ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBadgeCycleWorkflow(store: BadgeCycleStore, clockValue: clock.Clock): BadgeCycleWorkflow {
  return new BadgeCycleWorkflow(store, defaultBadgeCycleValidator(), clockValue, [], defaultBadgeCycleEngine());
}
