import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualPlacementEntryEngine, defaultManualPlacementEntryEngine } from "./manual-placement-entry-engine.js";
import {
  ManualPlacementEntryValidator,
  defaultManualPlacementEntryValidator,
} from "./manual-placement-entry-rules.js";
import { ManualPlacementEntryStore } from "./manual-placement-entry-store.js";

/** Moves manual placement entries through their life cycle and keeps a journal of what it did. */
export class ManualPlacementEntryWorkflow {
  store: ManualPlacementEntryStore;
  validator: ManualPlacementEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualPlacementEntryEngine;

  constructor(
    store: ManualPlacementEntryStore,
    validator: ManualPlacementEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualPlacementEntryEngine,
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
      throw new Error(`manual placement entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual placement entry ${code} not found`);
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
      throw new Error(`manual placement entry ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newManualPlacementEntryWorkflow(store: ManualPlacementEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualPlacementEntryWorkflow {
  return new ManualPlacementEntryWorkflow(
    store,
    defaultManualPlacementEntryValidator(),
    clockValue,
    [],
    defaultManualPlacementEntryEngine(flagsValue),
  );
}
