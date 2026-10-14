import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyRequestEngine, defaultReplyRequestEngine } from "./reply-request-engine.js";
import { ReplyRequestValidator, defaultReplyRequestValidator } from "./reply-request-rules.js";
import { ReplyRequestStore } from "./reply-request-store.js";

/** Moves reply requests through their life cycle and keeps a journal of what it did. */
export class ReplyRequestDesk {
  store: ReplyRequestStore;
  validator: ReplyRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyRequestEngine;

  constructor(
    store: ReplyRequestStore,
    validator: ReplyRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyRequestEngine,
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
      throw new Error(`reply request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newReplyRequestDesk(store: ReplyRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyRequestDesk {
  return new ReplyRequestDesk(
    store,
    defaultReplyRequestValidator(),
    clockValue,
    [],
    defaultReplyRequestEngine(flagsValue),
  );
}
