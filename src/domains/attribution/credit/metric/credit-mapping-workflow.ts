import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditMappingEngine, defaultCreditMappingEngine } from "./credit-mapping-engine.js";
import { CreditMappingValidator, defaultCreditMappingValidator } from "./credit-mapping-rules.js";
import { CreditMappingStore } from "./credit-mapping-store.js";

/** Moves credit mappings through their life cycle and keeps a journal of what it did. */
export class CreditMappingDesk {
  store: CreditMappingStore;
  validator: CreditMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditMappingEngine;

  constructor(
    store: CreditMappingStore,
    validator: CreditMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditMappingEngine,
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
      throw new Error(`credit mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit mapping ${code} not found`);
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

export function newCreditMappingDesk(store: CreditMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditMappingDesk {
  return new CreditMappingDesk(
    store,
    defaultCreditMappingValidator(),
    clockValue,
    [],
    defaultCreditMappingEngine(flagsValue),
  );
}
