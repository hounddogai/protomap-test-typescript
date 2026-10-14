import * as clock from "../../../../kit/clock.js";
import { CappedQueueWindowEngine, defaultCappedQueueWindowEngine } from "./capped-queue-window-engine.js";
import { CappedQueueWindowValidator, defaultCappedQueueWindowValidator } from "./capped-queue-window-rules.js";
import { CappedQueueWindowStore } from "./capped-queue-window-store.js";

/** Moves capped queue windows through their life cycle and keeps a journal of what it did. */
export class CappedQueueWindowManager {
  store: CappedQueueWindowStore;
  validator: CappedQueueWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedQueueWindowEngine;

  constructor(
    store: CappedQueueWindowStore,
    validator: CappedQueueWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedQueueWindowEngine,
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
      throw new Error(`capped queue window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped queue window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped queue window ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newCappedQueueWindowManager(store: CappedQueueWindowStore, clockValue: clock.Clock): CappedQueueWindowManager {
  return new CappedQueueWindowManager(
    store,
    defaultCappedQueueWindowValidator(),
    clockValue,
    [],
    defaultCappedQueueWindowEngine(),
  );
}
