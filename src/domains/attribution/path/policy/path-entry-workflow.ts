import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathEntryEngine, defaultPathEntryEngine } from "./path-entry-engine.js";
import { PathEntryValidator, defaultPathEntryValidator } from "./path-entry-rules.js";
import { PathEntryStore } from "./path-entry-store.js";

/** Moves path entries through their life cycle and keeps a journal of what it did. */
export class PathEntryDesk {
  store: PathEntryStore;
  validator: PathEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathEntryEngine;

  constructor(
    store: PathEntryStore,
    validator: PathEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathEntryEngine,
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
      throw new Error(`path entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path entry ${code} not found`);
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
      throw new Error(`path entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPathEntryDesk(store: PathEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathEntryDesk {
  return new PathEntryDesk(store, defaultPathEntryValidator(), clockValue, [], defaultPathEntryEngine(flagsValue));
}
