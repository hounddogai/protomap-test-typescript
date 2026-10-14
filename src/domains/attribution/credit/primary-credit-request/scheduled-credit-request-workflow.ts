import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledCreditRequestEngine,
  defaultScheduledCreditRequestEngine,
} from "./scheduled-credit-request-engine.js";
import {
  ScheduledCreditRequestValidator,
  defaultScheduledCreditRequestValidator,
} from "./scheduled-credit-request-rules.js";
import { ScheduledCreditRequestStore } from "./scheduled-credit-request-store.js";

/** Moves scheduled credit requests through their life cycle and keeps a journal of what it did. */
export class ScheduledCreditRequestDesk {
  store: ScheduledCreditRequestStore;
  validator: ScheduledCreditRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledCreditRequestEngine;

  constructor(
    store: ScheduledCreditRequestStore,
    validator: ScheduledCreditRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledCreditRequestEngine,
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
      throw new Error(`scheduled credit request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled credit request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled credit request ${code} not found`);
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

export function newScheduledCreditRequestDesk(store: ScheduledCreditRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledCreditRequestDesk {
  return new ScheduledCreditRequestDesk(
    store,
    defaultScheduledCreditRequestValidator(),
    clockValue,
    [],
    defaultScheduledCreditRequestEngine(flagsValue),
  );
}
