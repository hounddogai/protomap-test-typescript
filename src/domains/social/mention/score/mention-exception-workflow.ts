import * as clock from "../../../../kit/clock.js";
import { MentionExceptionEngine, defaultMentionExceptionEngine } from "./mention-exception-engine.js";
import { MentionExceptionValidator, defaultMentionExceptionValidator } from "./mention-exception-rules.js";
import { MentionExceptionStore } from "./mention-exception-store.js";

/** Moves mention exceptions through their life cycle and keeps a journal of what it did. */
export class MentionExceptionCoordinator {
  store: MentionExceptionStore;
  validator: MentionExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionExceptionEngine;

  constructor(
    store: MentionExceptionStore,
    validator: MentionExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionExceptionEngine,
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
      throw new Error(`mention exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention exception ${code} not found`);
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
      throw new Error(`mention exception ${code} not found`);
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

export function newMentionExceptionCoordinator(store: MentionExceptionStore, clockValue: clock.Clock): MentionExceptionCoordinator {
  return new MentionExceptionCoordinator(
    store,
    defaultMentionExceptionValidator(),
    clockValue,
    [],
    defaultMentionExceptionEngine(),
  );
}
