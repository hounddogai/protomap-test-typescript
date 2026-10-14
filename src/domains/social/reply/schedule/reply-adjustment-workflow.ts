import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyAdjustmentEngine, defaultReplyAdjustmentEngine } from "./reply-adjustment-engine.js";
import { ReplyAdjustmentValidator, defaultReplyAdjustmentValidator } from "./reply-adjustment-rules.js";
import { ReplyAdjustmentStore } from "./reply-adjustment-store.js";

/** Moves reply adjustments through their life cycle and keeps a journal of what it did. */
export class ReplyAdjustmentService {
  store: ReplyAdjustmentStore;
  validator: ReplyAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyAdjustmentEngine;

  constructor(
    store: ReplyAdjustmentStore,
    validator: ReplyAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyAdjustmentEngine,
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
      throw new Error(`reply adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newReplyAdjustmentService(store: ReplyAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyAdjustmentService {
  return new ReplyAdjustmentService(
    store,
    defaultReplyAdjustmentValidator(),
    clockValue,
    [],
    defaultReplyAdjustmentEngine(flagsValue),
  );
}
