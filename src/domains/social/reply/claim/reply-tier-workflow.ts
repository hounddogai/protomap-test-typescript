import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyTierEngine, defaultReplyTierEngine } from "./reply-tier-engine.js";
import { ReplyTierValidator, defaultReplyTierValidator } from "./reply-tier-rules.js";
import { ReplyTierStore } from "./reply-tier-store.js";

/** Moves reply tiers through their life cycle and keeps a journal of what it did. */
export class ReplyTierCoordinator {
  store: ReplyTierStore;
  validator: ReplyTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyTierEngine;

  constructor(
    store: ReplyTierStore,
    validator: ReplyTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyTierEngine,
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
      throw new Error(`reply tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newReplyTierCoordinator(store: ReplyTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyTierCoordinator {
  return new ReplyTierCoordinator(
    store,
    defaultReplyTierValidator(),
    clockValue,
    [],
    defaultReplyTierEngine(flagsValue),
  );
}
