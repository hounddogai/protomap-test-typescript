import * as clock from "../../../../kit/clock.js";
import { ManualFrequencyDraftEngine, defaultManualFrequencyDraftEngine } from "./manual-frequency-draft-engine.js";
import {
  ManualFrequencyDraftValidator,
  defaultManualFrequencyDraftValidator,
} from "./manual-frequency-draft-rules.js";
import { ManualFrequencyDraftStore } from "./manual-frequency-draft-store.js";

/** Moves manual frequency drafts through their life cycle and keeps a journal of what it did. */
export class ManualFrequencyDraftCoordinator {
  store: ManualFrequencyDraftStore;
  validator: ManualFrequencyDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualFrequencyDraftEngine;

  constructor(
    store: ManualFrequencyDraftStore,
    validator: ManualFrequencyDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualFrequencyDraftEngine,
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
      throw new Error(`manual frequency draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual frequency draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual frequency draft ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newManualFrequencyDraftCoordinator(store: ManualFrequencyDraftStore, clockValue: clock.Clock): ManualFrequencyDraftCoordinator {
  return new ManualFrequencyDraftCoordinator(
    store,
    defaultManualFrequencyDraftValidator(),
    clockValue,
    [],
    defaultManualFrequencyDraftEngine(),
  );
}
