import * as clock from "../../../../kit/clock.js";
import { ReplyAllocationEngine, defaultReplyAllocationEngine } from "./reply-allocation-engine.js";
import { ReplyAllocationValidator, defaultReplyAllocationValidator } from "./reply-allocation-rules.js";
import { ReplyAllocationStore } from "./reply-allocation-store.js";

/** Moves reply allocations through their life cycle and keeps a journal of what it did. */
export class ReplyAllocationWorkflow {
  store: ReplyAllocationStore;
  validator: ReplyAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyAllocationEngine;

  constructor(
    store: ReplyAllocationStore,
    validator: ReplyAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyAllocationEngine,
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
      throw new Error(`reply allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply allocation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newReplyAllocationWorkflow(store: ReplyAllocationStore, clockValue: clock.Clock): ReplyAllocationWorkflow {
  return new ReplyAllocationWorkflow(
    store,
    defaultReplyAllocationValidator(),
    clockValue,
    [],
    defaultReplyAllocationEngine(),
  );
}
