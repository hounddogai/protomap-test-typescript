import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DeflectionSegmentEngine, defaultDeflectionSegmentEngine } from "./deflection-segment-engine.js";
import { DeflectionSegmentValidator, defaultDeflectionSegmentValidator } from "./deflection-segment-rules.js";
import { DeflectionSegmentStore } from "./deflection-segment-store.js";

/** Moves deflection segments through their life cycle and keeps a journal of what it did. */
export class DeflectionSegmentService {
  store: DeflectionSegmentStore;
  validator: DeflectionSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionSegmentEngine;

  constructor(
    store: DeflectionSegmentStore,
    validator: DeflectionSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionSegmentEngine,
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
      throw new Error(`deflection segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection segment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDeflectionSegmentService(store: DeflectionSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): DeflectionSegmentService {
  return new DeflectionSegmentService(
    store,
    defaultDeflectionSegmentValidator(),
    clockValue,
    [],
    defaultDeflectionSegmentEngine(flagsValue),
  );
}
