import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReputationExceptionEngine, defaultReputationExceptionEngine } from "./reputation-exception-engine.js";
import { ReputationExceptionValidator, defaultReputationExceptionValidator } from "./reputation-exception-rules.js";
import { ReputationExceptionStore } from "./reputation-exception-store.js";

/** Moves reputation exceptions through their life cycle and keeps a journal of what it did. */
export class ReputationExceptionManager {
  store: ReputationExceptionStore;
  validator: ReputationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationExceptionEngine;

  constructor(
    store: ReputationExceptionStore,
    validator: ReputationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationExceptionEngine,
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
      throw new Error(`reputation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation exception ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newReputationExceptionManager(store: ReputationExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReputationExceptionManager {
  return new ReputationExceptionManager(
    store,
    defaultReputationExceptionValidator(),
    clockValue,
    [],
    defaultReputationExceptionEngine(flagsValue),
  );
}
