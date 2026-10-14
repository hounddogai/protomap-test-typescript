import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { MentionPreferenceEngine, defaultMentionPreferenceEngine } from "./mention-preference-engine.js";
import { MentionPreferenceValidator, defaultMentionPreferenceValidator } from "./mention-preference-rules.js";
import { MentionPreferenceStore } from "./mention-preference-store.js";

/** Moves mention preferences through their life cycle and keeps a journal of what it did. */
export class MentionPreferenceCoordinator {
  store: MentionPreferenceStore;
  validator: MentionPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionPreferenceEngine;

  constructor(
    store: MentionPreferenceStore,
    validator: MentionPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionPreferenceEngine,
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
      throw new Error(`mention preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention preference ${code} not found`);
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

export function newMentionPreferenceCoordinator(store: MentionPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): MentionPreferenceCoordinator {
  return new MentionPreferenceCoordinator(
    store,
    defaultMentionPreferenceValidator(),
    clockValue,
    [],
    defaultMentionPreferenceEngine(flagsValue),
  );
}
