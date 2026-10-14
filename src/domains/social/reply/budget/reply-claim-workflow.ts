import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyClaimEngine, defaultReplyClaimEngine } from "./reply-claim-engine.js";
import { ReplyClaimValidator, defaultReplyClaimValidator } from "./reply-claim-rules.js";
import { ReplyClaimStore } from "./reply-claim-store.js";

/** Moves reply claims through their life cycle and keeps a journal of what it did. */
export class ReplyClaimDesk {
  store: ReplyClaimStore;
  validator: ReplyClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyClaimEngine;

  constructor(
    store: ReplyClaimStore,
    validator: ReplyClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyClaimEngine,
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
      throw new Error(`reply claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply claim ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newReplyClaimDesk(store: ReplyClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyClaimDesk {
  return new ReplyClaimDesk(store, defaultReplyClaimValidator(), clockValue, [], defaultReplyClaimEngine(flagsValue));
}
