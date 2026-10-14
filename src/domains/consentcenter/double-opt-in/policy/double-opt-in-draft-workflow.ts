import * as clock from "../../../../kit/clock.js";
import { DoubleOptInDraftEngine, defaultDoubleOptInDraftEngine } from "./double-opt-in-draft-engine.js";
import { DoubleOptInDraftValidator, defaultDoubleOptInDraftValidator } from "./double-opt-in-draft-rules.js";
import { DoubleOptInDraftStore } from "./double-opt-in-draft-store.js";

/** Moves double opt in drafts through their life cycle and keeps a journal of what it did. */
export class DoubleOptInDraftManager {
  store: DoubleOptInDraftStore;
  validator: DoubleOptInDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInDraftEngine;

  constructor(
    store: DoubleOptInDraftStore,
    validator: DoubleOptInDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInDraftEngine,
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
      throw new Error(`double opt in draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in draft ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDoubleOptInDraftManager(store: DoubleOptInDraftStore, clockValue: clock.Clock): DoubleOptInDraftManager {
  return new DoubleOptInDraftManager(
    store,
    defaultDoubleOptInDraftValidator(),
    clockValue,
    [],
    defaultDoubleOptInDraftEngine(),
  );
}
