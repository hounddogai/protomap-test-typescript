import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BranchEntryEngine, defaultBranchEntryEngine } from "./branch-entry-engine.js";
import { BranchEntryValidator, defaultBranchEntryValidator } from "./branch-entry-rules.js";
import { BranchEntryStore } from "./branch-entry-store.js";

/** Moves branch entries through their life cycle and keeps a journal of what it did. */
export class BranchEntryCoordinator {
  store: BranchEntryStore;
  validator: BranchEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchEntryEngine;

  constructor(
    store: BranchEntryStore,
    validator: BranchEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchEntryEngine,
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
      throw new Error(`branch entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch entry ${code} not found`);
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
      throw new Error(`branch entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBranchEntryCoordinator(store: BranchEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): BranchEntryCoordinator {
  return new BranchEntryCoordinator(
    store,
    defaultBranchEntryValidator(),
    clockValue,
    [],
    defaultBranchEntryEngine(flagsValue),
  );
}
