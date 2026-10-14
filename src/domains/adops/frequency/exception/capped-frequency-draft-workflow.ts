import * as clock from "../../../../kit/clock.js";
import { CappedFrequencyDraftEngine, defaultCappedFrequencyDraftEngine } from "./capped-frequency-draft-engine.js";
import {
  CappedFrequencyDraftValidator,
  defaultCappedFrequencyDraftValidator,
} from "./capped-frequency-draft-rules.js";
import { CappedFrequencyDraftStore } from "./capped-frequency-draft-store.js";

/** Moves capped frequency drafts through their life cycle and keeps a journal of what it did. */
export class CappedFrequencyDraftWorkflow {
  store: CappedFrequencyDraftStore;
  validator: CappedFrequencyDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedFrequencyDraftEngine;

  constructor(
    store: CappedFrequencyDraftStore,
    validator: CappedFrequencyDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedFrequencyDraftEngine,
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
      throw new Error(`capped frequency draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped frequency draft ${code} not found`);
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
      throw new Error(`capped frequency draft ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCappedFrequencyDraftWorkflow(store: CappedFrequencyDraftStore, clockValue: clock.Clock): CappedFrequencyDraftWorkflow {
  return new CappedFrequencyDraftWorkflow(
    store,
    defaultCappedFrequencyDraftValidator(),
    clockValue,
    [],
    defaultCappedFrequencyDraftEngine(),
  );
}
