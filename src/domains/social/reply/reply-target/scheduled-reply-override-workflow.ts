import * as clock from "../../../../kit/clock.js";
import {
  ScheduledReplyOverrideEngine,
  defaultScheduledReplyOverrideEngine,
} from "./scheduled-reply-override-engine.js";
import {
  ScheduledReplyOverrideValidator,
  defaultScheduledReplyOverrideValidator,
} from "./scheduled-reply-override-rules.js";
import { ScheduledReplyOverrideStore } from "./scheduled-reply-override-store.js";

/** Moves scheduled reply overrides through their life cycle and keeps a journal of what it did. */
export class ScheduledReplyOverrideManager {
  store: ScheduledReplyOverrideStore;
  validator: ScheduledReplyOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledReplyOverrideEngine;

  constructor(
    store: ScheduledReplyOverrideStore,
    validator: ScheduledReplyOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledReplyOverrideEngine,
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
      throw new Error(`scheduled reply override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled reply override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled reply override ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newScheduledReplyOverrideManager(store: ScheduledReplyOverrideStore, clockValue: clock.Clock): ScheduledReplyOverrideManager {
  return new ScheduledReplyOverrideManager(
    store,
    defaultScheduledReplyOverrideValidator(),
    clockValue,
    [],
    defaultScheduledReplyOverrideEngine(),
  );
}
