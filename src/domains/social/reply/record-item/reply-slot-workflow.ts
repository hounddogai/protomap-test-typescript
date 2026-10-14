import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplySlotEngine, defaultReplySlotEngine } from "./reply-slot-engine.js";
import { ReplySlotValidator, defaultReplySlotValidator } from "./reply-slot-rules.js";
import { ReplySlotStore } from "./reply-slot-store.js";

/** Moves reply slots through their life cycle and keeps a journal of what it did. */
export class ReplySlotWorkflow {
  store: ReplySlotStore;
  validator: ReplySlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplySlotEngine;

  constructor(
    store: ReplySlotStore,
    validator: ReplySlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplySlotEngine,
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
      throw new Error(`reply slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply slot ${code} not found`);
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
      throw new Error(`reply slot ${code} not found`);
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

export function newReplySlotWorkflow(store: ReplySlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplySlotWorkflow {
  return new ReplySlotWorkflow(store, defaultReplySlotValidator(), clockValue, [], defaultReplySlotEngine(flagsValue));
}
