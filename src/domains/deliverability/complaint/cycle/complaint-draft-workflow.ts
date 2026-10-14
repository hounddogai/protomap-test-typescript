import * as clock from "../../../../kit/clock.js";
import { ComplaintDraftEngine, defaultComplaintDraftEngine } from "./complaint-draft-engine.js";
import { ComplaintDraftValidator, defaultComplaintDraftValidator } from "./complaint-draft-rules.js";
import { ComplaintDraftStore } from "./complaint-draft-store.js";

/** Moves complaint drafts through their life cycle and keeps a journal of what it did. */
export class ComplaintDraftService {
  store: ComplaintDraftStore;
  validator: ComplaintDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintDraftEngine;

  constructor(
    store: ComplaintDraftStore,
    validator: ComplaintDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintDraftEngine,
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
      throw new Error(`complaint draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint draft ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newComplaintDraftService(store: ComplaintDraftStore, clockValue: clock.Clock): ComplaintDraftService {
  return new ComplaintDraftService(
    store,
    defaultComplaintDraftValidator(),
    clockValue,
    [],
    defaultComplaintDraftEngine(),
  );
}
