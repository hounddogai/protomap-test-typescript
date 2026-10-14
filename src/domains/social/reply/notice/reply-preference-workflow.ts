import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyPreferenceEngine, defaultReplyPreferenceEngine } from "./reply-preference-engine.js";
import { ReplyPreferenceValidator, defaultReplyPreferenceValidator } from "./reply-preference-rules.js";
import { ReplyPreferenceStore } from "./reply-preference-store.js";

/** Moves reply preferences through their life cycle and keeps a journal of what it did. */
export class ReplyPreferenceDesk {
  store: ReplyPreferenceStore;
  validator: ReplyPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyPreferenceEngine;

  constructor(
    store: ReplyPreferenceStore,
    validator: ReplyPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyPreferenceEngine,
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
      throw new Error(`reply preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply preference ${code} not found`);
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
      throw new Error(`reply preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newReplyPreferenceDesk(store: ReplyPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyPreferenceDesk {
  return new ReplyPreferenceDesk(
    store,
    defaultReplyPreferenceValidator(),
    clockValue,
    [],
    defaultReplyPreferenceEngine(flagsValue),
  );
}
