import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyProfileEngine, defaultReplyProfileEngine } from "./reply-profile-engine.js";
import { ReplyProfileValidator, defaultReplyProfileValidator } from "./reply-profile-rules.js";
import { ReplyProfileStore } from "./reply-profile-store.js";

/** Moves reply profiles through their life cycle and keeps a journal of what it did. */
export class ReplyProfileCoordinator {
  store: ReplyProfileStore;
  validator: ReplyProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyProfileEngine;

  constructor(
    store: ReplyProfileStore,
    validator: ReplyProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyProfileEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply profile ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newReplyProfileCoordinator(store: ReplyProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyProfileCoordinator {
  return new ReplyProfileCoordinator(
    store,
    defaultReplyProfileValidator(),
    clockValue,
    [],
    defaultReplyProfileEngine(flagsValue),
  );
}
