import * as clock from "../../../../kit/clock.js";
import { CohortWindowEngine, defaultCohortWindowEngine } from "./cohort-window-engine.js";
import { CohortWindowValidator, defaultCohortWindowValidator } from "./cohort-window-rules.js";
import { CohortWindowStore } from "./cohort-window-store.js";

/** Moves cohort windows through their life cycle and keeps a journal of what it did. */
export class CohortWindowWorkflow {
  store: CohortWindowStore;
  validator: CohortWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortWindowEngine;

  constructor(
    store: CohortWindowStore,
    validator: CohortWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortWindowEngine,
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
      throw new Error(`cohort window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort window ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCohortWindowWorkflow(store: CohortWindowStore, clockValue: clock.Clock): CohortWindowWorkflow {
  return new CohortWindowWorkflow(store, defaultCohortWindowValidator(), clockValue, [], defaultCohortWindowEngine());
}
