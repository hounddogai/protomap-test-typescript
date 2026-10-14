import * as clock from "../../../../kit/clock.js";
import { CsatAssignmentEngine, defaultCsatAssignmentEngine } from "./csat-assignment-engine.js";
import { CsatAssignmentValidator, defaultCsatAssignmentValidator } from "./csat-assignment-rules.js";
import { CsatAssignmentStore } from "./csat-assignment-store.js";

/** Moves csat assignments through their life cycle and keeps a journal of what it did. */
export class CsatAssignmentDesk {
  store: CsatAssignmentStore;
  validator: CsatAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatAssignmentEngine;

  constructor(
    store: CsatAssignmentStore,
    validator: CsatAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatAssignmentEngine,
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
      throw new Error(`csat assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat assignment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newCsatAssignmentDesk(store: CsatAssignmentStore, clockValue: clock.Clock): CsatAssignmentDesk {
  return new CsatAssignmentDesk(store, defaultCsatAssignmentValidator(), clockValue, [], defaultCsatAssignmentEngine());
}
