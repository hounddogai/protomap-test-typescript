import * as clock from "../../../../kit/clock.js";
import { OptOutExceptionEngine, defaultOptOutExceptionEngine } from "./opt-out-exception-engine.js";
import { OptOutExceptionValidator, defaultOptOutExceptionValidator } from "./opt-out-exception-rules.js";
import { OptOutExceptionStore } from "./opt-out-exception-store.js";

/** Moves opt out exceptions through their life cycle and keeps a journal of what it did. */
export class OptOutExceptionCoordinator {
  store: OptOutExceptionStore;
  validator: OptOutExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutExceptionEngine;

  constructor(
    store: OptOutExceptionStore,
    validator: OptOutExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutExceptionEngine,
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
      throw new Error(`opt out exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out exception ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newOptOutExceptionCoordinator(store: OptOutExceptionStore, clockValue: clock.Clock): OptOutExceptionCoordinator {
  return new OptOutExceptionCoordinator(
    store,
    defaultOptOutExceptionValidator(),
    clockValue,
    [],
    defaultOptOutExceptionEngine(),
  );
}
