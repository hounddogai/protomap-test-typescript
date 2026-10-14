import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CsatExceptionEngine, defaultCsatExceptionEngine } from "./csat-exception-engine.js";
import { CsatExceptionValidator, defaultCsatExceptionValidator } from "./csat-exception-rules.js";
import { CsatExceptionStore } from "./csat-exception-store.js";

/** Moves csat exceptions through their life cycle and keeps a journal of what it did. */
export class CsatExceptionService {
  store: CsatExceptionStore;
  validator: CsatExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatExceptionEngine;

  constructor(
    store: CsatExceptionStore,
    validator: CsatExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatExceptionEngine,
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
      throw new Error(`csat exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat exception ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newCsatExceptionService(store: CsatExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): CsatExceptionService {
  return new CsatExceptionService(
    store,
    defaultCsatExceptionValidator(),
    clockValue,
    [],
    defaultCsatExceptionEngine(flagsValue),
  );
}
