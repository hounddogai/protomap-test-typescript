import * as clock from "../../../../kit/clock.js";
import { CappedReputationDraftEngine, defaultCappedReputationDraftEngine } from "./capped-reputation-draft-engine.js";
import {
  CappedReputationDraftValidator,
  defaultCappedReputationDraftValidator,
} from "./capped-reputation-draft-rules.js";
import { CappedReputationDraftStore } from "./capped-reputation-draft-store.js";

/** Moves capped reputation drafts through their life cycle and keeps a journal of what it did. */
export class CappedReputationDraftDesk {
  store: CappedReputationDraftStore;
  validator: CappedReputationDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedReputationDraftEngine;

  constructor(
    store: CappedReputationDraftStore,
    validator: CappedReputationDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedReputationDraftEngine,
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
      throw new Error(`capped reputation draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reputation draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reputation draft ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedReputationDraftDesk(store: CappedReputationDraftStore, clockValue: clock.Clock): CappedReputationDraftDesk {
  return new CappedReputationDraftDesk(
    store,
    defaultCappedReputationDraftValidator(),
    clockValue,
    [],
    defaultCappedReputationDraftEngine(),
  );
}
