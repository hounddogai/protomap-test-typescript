import * as clock from "../../../../kit/clock.js";
import { StrictMentionOverrideEngine, defaultStrictMentionOverrideEngine } from "./strict-mention-override-engine.js";
import {
  StrictMentionOverrideValidator,
  defaultStrictMentionOverrideValidator,
} from "./strict-mention-override-rules.js";
import { StrictMentionOverrideStore } from "./strict-mention-override-store.js";

/** Moves strict mention overrides through their life cycle and keeps a journal of what it did. */
export class StrictMentionOverrideDesk {
  store: StrictMentionOverrideStore;
  validator: StrictMentionOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictMentionOverrideEngine;

  constructor(
    store: StrictMentionOverrideStore,
    validator: StrictMentionOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictMentionOverrideEngine,
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
      throw new Error(`strict mention override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict mention override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict mention override ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newStrictMentionOverrideDesk(store: StrictMentionOverrideStore, clockValue: clock.Clock): StrictMentionOverrideDesk {
  return new StrictMentionOverrideDesk(
    store,
    defaultStrictMentionOverrideValidator(),
    clockValue,
    [],
    defaultStrictMentionOverrideEngine(),
  );
}
