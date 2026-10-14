import * as clock from "../../../../kit/clock.js";
import { EnrollmentDraftEngine, defaultEnrollmentDraftEngine } from "./enrollment-draft-engine.js";
import { EnrollmentDraftValidator, defaultEnrollmentDraftValidator } from "./enrollment-draft-rules.js";
import { EnrollmentDraftStore } from "./enrollment-draft-store.js";

/** Moves enrollment drafts through their life cycle and keeps a journal of what it did. */
export class EnrollmentDraftService {
  store: EnrollmentDraftStore;
  validator: EnrollmentDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentDraftEngine;

  constructor(
    store: EnrollmentDraftStore,
    validator: EnrollmentDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentDraftEngine,
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
      throw new Error(`enrollment draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment draft ${code} not found`);
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
      throw new Error(`enrollment draft ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newEnrollmentDraftService(store: EnrollmentDraftStore, clockValue: clock.Clock): EnrollmentDraftService {
  return new EnrollmentDraftService(
    store,
    defaultEnrollmentDraftValidator(),
    clockValue,
    [],
    defaultEnrollmentDraftEngine(),
  );
}
