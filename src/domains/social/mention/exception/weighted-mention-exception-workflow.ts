import * as clock from "../../../../kit/clock.js";
import {
  WeightedMentionExceptionEngine,
  defaultWeightedMentionExceptionEngine,
} from "./weighted-mention-exception-engine.js";
import {
  WeightedMentionExceptionValidator,
  defaultWeightedMentionExceptionValidator,
} from "./weighted-mention-exception-rules.js";
import { WeightedMentionExceptionStore } from "./weighted-mention-exception-store.js";

/** Moves weighted mention exceptions through their life cycle and keeps a journal of what it did. */
export class WeightedMentionExceptionManager {
  store: WeightedMentionExceptionStore;
  validator: WeightedMentionExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedMentionExceptionEngine;

  constructor(
    store: WeightedMentionExceptionStore,
    validator: WeightedMentionExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedMentionExceptionEngine,
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
      throw new Error(`weighted mention exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention exception ${code} not found`);
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

export function newWeightedMentionExceptionManager(store: WeightedMentionExceptionStore, clockValue: clock.Clock): WeightedMentionExceptionManager {
  return new WeightedMentionExceptionManager(
    store,
    defaultWeightedMentionExceptionValidator(),
    clockValue,
    [],
    defaultWeightedMentionExceptionEngine(),
  );
}
