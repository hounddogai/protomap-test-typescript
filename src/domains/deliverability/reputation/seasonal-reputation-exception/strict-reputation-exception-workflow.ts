import * as clock from "../../../../kit/clock.js";
import {
  StrictReputationExceptionEngine,
  defaultStrictReputationExceptionEngine,
} from "./strict-reputation-exception-engine.js";
import {
  StrictReputationExceptionValidator,
  defaultStrictReputationExceptionValidator,
} from "./strict-reputation-exception-rules.js";
import { StrictReputationExceptionStore } from "./strict-reputation-exception-store.js";

/** Moves strict reputation exceptions through their life cycle and keeps a journal of what it did. */
export class StrictReputationExceptionManager {
  store: StrictReputationExceptionStore;
  validator: StrictReputationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictReputationExceptionEngine;

  constructor(
    store: StrictReputationExceptionStore,
    validator: StrictReputationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictReputationExceptionEngine,
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
      throw new Error(`strict reputation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation exception ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newStrictReputationExceptionManager(store: StrictReputationExceptionStore, clockValue: clock.Clock): StrictReputationExceptionManager {
  return new StrictReputationExceptionManager(
    store,
    defaultStrictReputationExceptionValidator(),
    clockValue,
    [],
    defaultStrictReputationExceptionEngine(),
  );
}
