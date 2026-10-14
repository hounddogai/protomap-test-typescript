import * as clock from "../../../../kit/clock.js";
import {
  WeightedSenderExceptionEngine,
  defaultWeightedSenderExceptionEngine,
} from "./weighted-sender-exception-engine.js";
import {
  WeightedSenderExceptionValidator,
  defaultWeightedSenderExceptionValidator,
} from "./weighted-sender-exception-rules.js";
import { WeightedSenderExceptionStore } from "./weighted-sender-exception-store.js";

/** Moves weighted sender exceptions through their life cycle and keeps a journal of what it did. */
export class WeightedSenderExceptionManager {
  store: WeightedSenderExceptionStore;
  validator: WeightedSenderExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedSenderExceptionEngine;

  constructor(
    store: WeightedSenderExceptionStore,
    validator: WeightedSenderExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedSenderExceptionEngine,
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
      throw new Error(`weighted sender exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted sender exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted sender exception ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedSenderExceptionManager(store: WeightedSenderExceptionStore, clockValue: clock.Clock): WeightedSenderExceptionManager {
  return new WeightedSenderExceptionManager(
    store,
    defaultWeightedSenderExceptionValidator(),
    clockValue,
    [],
    defaultWeightedSenderExceptionEngine(),
  );
}
