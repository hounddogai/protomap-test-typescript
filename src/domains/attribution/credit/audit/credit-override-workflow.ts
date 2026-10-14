import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditOverrideEngine, defaultCreditOverrideEngine } from "./credit-override-engine.js";
import { CreditOverrideValidator, defaultCreditOverrideValidator } from "./credit-override-rules.js";
import { CreditOverrideStore } from "./credit-override-store.js";

/** Moves credit overrides through their life cycle and keeps a journal of what it did. */
export class CreditOverrideManager {
  store: CreditOverrideStore;
  validator: CreditOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditOverrideEngine;

  constructor(
    store: CreditOverrideStore,
    validator: CreditOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditOverrideEngine,
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
      throw new Error(`credit override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit override ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCreditOverrideManager(store: CreditOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditOverrideManager {
  return new CreditOverrideManager(
    store,
    defaultCreditOverrideValidator(),
    clockValue,
    [],
    defaultCreditOverrideEngine(flagsValue),
  );
}
