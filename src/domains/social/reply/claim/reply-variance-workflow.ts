import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyVarianceEngine, defaultReplyVarianceEngine } from "./reply-variance-engine.js";
import { ReplyVarianceValidator, defaultReplyVarianceValidator } from "./reply-variance-rules.js";
import { ReplyVarianceStore } from "./reply-variance-store.js";

/** Moves reply variances through their life cycle and keeps a journal of what it did. */
export class ReplyVarianceManager {
  store: ReplyVarianceStore;
  validator: ReplyVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyVarianceEngine;

  constructor(
    store: ReplyVarianceStore,
    validator: ReplyVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyVarianceEngine,
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
      throw new Error(`reply variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply variance ${code} not found`);
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
      throw new Error(`reply variance ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newReplyVarianceManager(store: ReplyVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyVarianceManager {
  return new ReplyVarianceManager(
    store,
    defaultReplyVarianceValidator(),
    clockValue,
    [],
    defaultReplyVarianceEngine(flagsValue),
  );
}
