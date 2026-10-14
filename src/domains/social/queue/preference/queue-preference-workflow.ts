import * as clock from "../../../../kit/clock.js";
import { QueuePreferenceEngine, defaultQueuePreferenceEngine } from "./queue-preference-engine.js";
import { QueuePreferenceValidator, defaultQueuePreferenceValidator } from "./queue-preference-rules.js";
import { QueuePreferenceStore } from "./queue-preference-store.js";

/** Moves queue preferences through their life cycle and keeps a journal of what it did. */
export class QueuePreferenceDesk {
  store: QueuePreferenceStore;
  validator: QueuePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueuePreferenceEngine;

  constructor(
    store: QueuePreferenceStore,
    validator: QueuePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueuePreferenceEngine,
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
      throw new Error(`queue preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue preference ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newQueuePreferenceDesk(store: QueuePreferenceStore, clockValue: clock.Clock): QueuePreferenceDesk {
  return new QueuePreferenceDesk(
    store,
    defaultQueuePreferenceValidator(),
    clockValue,
    [],
    defaultQueuePreferenceEngine(),
  );
}
