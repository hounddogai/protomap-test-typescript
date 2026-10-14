import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WaitEntryEngine, defaultWaitEntryEngine } from "./wait-entry-engine.js";
import { WaitEntryValidator, defaultWaitEntryValidator } from "./wait-entry-rules.js";
import { WaitEntryStore } from "./wait-entry-store.js";

/** Moves wait entries through their life cycle and keeps a journal of what it did. */
export class WaitEntryWorkflow {
  store: WaitEntryStore;
  validator: WaitEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitEntryEngine;

  constructor(
    store: WaitEntryStore,
    validator: WaitEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitEntryEngine,
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
      throw new Error(`wait entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait entry ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWaitEntryWorkflow(store: WaitEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): WaitEntryWorkflow {
  return new WaitEntryWorkflow(store, defaultWaitEntryValidator(), clockValue, [], defaultWaitEntryEngine(flagsValue));
}
