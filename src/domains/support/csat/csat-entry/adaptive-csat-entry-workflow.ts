import * as clock from "../../../../kit/clock.js";
import { AdaptiveCsatEntryEngine, defaultAdaptiveCsatEntryEngine } from "./adaptive-csat-entry-engine.js";
import { AdaptiveCsatEntryValidator, defaultAdaptiveCsatEntryValidator } from "./adaptive-csat-entry-rules.js";
import { AdaptiveCsatEntryStore } from "./adaptive-csat-entry-store.js";

/** Moves adaptive csat entries through their life cycle and keeps a journal of what it did. */
export class AdaptiveCsatEntryWorkflow {
  store: AdaptiveCsatEntryStore;
  validator: AdaptiveCsatEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveCsatEntryEngine;

  constructor(
    store: AdaptiveCsatEntryStore,
    validator: AdaptiveCsatEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveCsatEntryEngine,
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
      throw new Error(`adaptive csat entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat entry ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newAdaptiveCsatEntryWorkflow(store: AdaptiveCsatEntryStore, clockValue: clock.Clock): AdaptiveCsatEntryWorkflow {
  return new AdaptiveCsatEntryWorkflow(
    store,
    defaultAdaptiveCsatEntryValidator(),
    clockValue,
    [],
    defaultAdaptiveCsatEntryEngine(),
  );
}
