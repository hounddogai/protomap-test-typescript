import * as clock from "../../../../kit/clock.js";
import {
  DoubleOptInAssignmentEngine,
  defaultDoubleOptInAssignmentEngine,
} from "./double-opt-in-assignment-engine.js";
import {
  DoubleOptInAssignmentValidator,
  defaultDoubleOptInAssignmentValidator,
} from "./double-opt-in-assignment-rules.js";
import { DoubleOptInAssignmentStore } from "./double-opt-in-assignment-store.js";

/** Moves double opt in assignments through their life cycle and keeps a journal of what it did. */
export class DoubleOptInAssignmentService {
  store: DoubleOptInAssignmentStore;
  validator: DoubleOptInAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInAssignmentEngine;

  constructor(
    store: DoubleOptInAssignmentStore,
    validator: DoubleOptInAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInAssignmentEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in assignment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDoubleOptInAssignmentService(store: DoubleOptInAssignmentStore, clockValue: clock.Clock): DoubleOptInAssignmentService {
  return new DoubleOptInAssignmentService(
    store,
    defaultDoubleOptInAssignmentValidator(),
    clockValue,
    [],
    defaultDoubleOptInAssignmentEngine(),
  );
}
