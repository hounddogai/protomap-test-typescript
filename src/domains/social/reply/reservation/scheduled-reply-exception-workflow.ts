import * as clock from "../../../../kit/clock.js";
import {
  ScheduledReplyExceptionEngine,
  defaultScheduledReplyExceptionEngine,
} from "./scheduled-reply-exception-engine.js";
import {
  ScheduledReplyExceptionValidator,
  defaultScheduledReplyExceptionValidator,
} from "./scheduled-reply-exception-rules.js";
import { ScheduledReplyExceptionStore } from "./scheduled-reply-exception-store.js";

/** Moves scheduled reply exceptions through their life cycle and keeps a journal of what it did. */
export class ScheduledReplyExceptionManager {
  store: ScheduledReplyExceptionStore;
  validator: ScheduledReplyExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledReplyExceptionEngine;

  constructor(
    store: ScheduledReplyExceptionStore,
    validator: ScheduledReplyExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledReplyExceptionEngine,
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
      throw new Error(`scheduled reply exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled reply exception ${code} not found`);
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
      throw new Error(`scheduled reply exception ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newScheduledReplyExceptionManager(store: ScheduledReplyExceptionStore, clockValue: clock.Clock): ScheduledReplyExceptionManager {
  return new ScheduledReplyExceptionManager(
    store,
    defaultScheduledReplyExceptionValidator(),
    clockValue,
    [],
    defaultScheduledReplyExceptionEngine(),
  );
}
