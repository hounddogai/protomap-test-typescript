import * as clock from "../../../../kit/clock.js";
import { JourneyAssignmentEngine, defaultJourneyAssignmentEngine } from "./journey-assignment-engine.js";
import { JourneyAssignmentValidator, defaultJourneyAssignmentValidator } from "./journey-assignment-rules.js";
import { JourneyAssignmentStore } from "./journey-assignment-store.js";

/** Moves journey assignments through their life cycle and keeps a journal of what it did. */
export class JourneyAssignmentService {
  store: JourneyAssignmentStore;
  validator: JourneyAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyAssignmentEngine;

  constructor(
    store: JourneyAssignmentStore,
    validator: JourneyAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyAssignmentEngine,
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
      throw new Error(`journey assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey assignment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newJourneyAssignmentService(store: JourneyAssignmentStore, clockValue: clock.Clock): JourneyAssignmentService {
  return new JourneyAssignmentService(
    store,
    defaultJourneyAssignmentValidator(),
    clockValue,
    [],
    defaultJourneyAssignmentEngine(),
  );
}
