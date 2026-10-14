import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedDomainEntryEngine, defaultCappedDomainEntryEngine } from "./capped-domain-entry-engine.js";
import { CappedDomainEntryValidator, defaultCappedDomainEntryValidator } from "./capped-domain-entry-rules.js";
import { CappedDomainEntryStore } from "./capped-domain-entry-store.js";

/** Moves capped domain entries through their life cycle and keeps a journal of what it did. */
export class CappedDomainEntryWorkflow {
  store: CappedDomainEntryStore;
  validator: CappedDomainEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedDomainEntryEngine;

  constructor(
    store: CappedDomainEntryStore,
    validator: CappedDomainEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedDomainEntryEngine,
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
      throw new Error(`capped domain entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped domain entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped domain entry ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCappedDomainEntryWorkflow(store: CappedDomainEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedDomainEntryWorkflow {
  return new CappedDomainEntryWorkflow(
    store,
    defaultCappedDomainEntryValidator(),
    clockValue,
    [],
    defaultCappedDomainEntryEngine(flagsValue),
  );
}
