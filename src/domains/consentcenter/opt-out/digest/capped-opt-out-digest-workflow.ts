import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedOptOutDigestEngine, defaultCappedOptOutDigestEngine } from "./capped-opt-out-digest-engine.js";
import { CappedOptOutDigestValidator, defaultCappedOptOutDigestValidator } from "./capped-opt-out-digest-rules.js";
import { CappedOptOutDigestStore } from "./capped-opt-out-digest-store.js";

/** Moves capped opt out digests through their life cycle and keeps a journal of what it did. */
export class CappedOptOutDigestManager {
  store: CappedOptOutDigestStore;
  validator: CappedOptOutDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedOptOutDigestEngine;

  constructor(
    store: CappedOptOutDigestStore,
    validator: CappedOptOutDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedOptOutDigestEngine,
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
      throw new Error(`capped opt out digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped opt out digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped opt out digest ${code} not found`);
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

export function newCappedOptOutDigestManager(store: CappedOptOutDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedOptOutDigestManager {
  return new CappedOptOutDigestManager(
    store,
    defaultCappedOptOutDigestValidator(),
    clockValue,
    [],
    defaultCappedOptOutDigestEngine(flagsValue),
  );
}
