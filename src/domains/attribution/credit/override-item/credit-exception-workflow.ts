import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditExceptionEngine, defaultCreditExceptionEngine } from "./credit-exception-engine.js";
import { CreditExceptionValidator, defaultCreditExceptionValidator } from "./credit-exception-rules.js";
import { CreditExceptionStore } from "./credit-exception-store.js";

/** Moves credit exceptions through their life cycle and keeps a journal of what it did. */
export class CreditExceptionDesk {
  store: CreditExceptionStore;
  validator: CreditExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditExceptionEngine;

  constructor(
    store: CreditExceptionStore,
    validator: CreditExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditExceptionEngine,
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
      throw new Error(`credit exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit exception ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCreditExceptionDesk(store: CreditExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditExceptionDesk {
  return new CreditExceptionDesk(
    store,
    defaultCreditExceptionValidator(),
    clockValue,
    [],
    defaultCreditExceptionEngine(flagsValue),
  );
}
