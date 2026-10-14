import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditEstimateEngine, defaultCreditEstimateEngine } from "./credit-estimate-engine.js";
import { CreditEstimateValidator, defaultCreditEstimateValidator } from "./credit-estimate-rules.js";
import { CreditEstimateStore } from "./credit-estimate-store.js";

/** Moves credit estimates through their life cycle and keeps a journal of what it did. */
export class CreditEstimateWorkflow {
  store: CreditEstimateStore;
  validator: CreditEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditEstimateEngine;

  constructor(
    store: CreditEstimateStore,
    validator: CreditEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditEstimateEngine,
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
      throw new Error(`credit estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit estimate ${code} not found`);
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

export function newCreditEstimateWorkflow(store: CreditEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditEstimateWorkflow {
  return new CreditEstimateWorkflow(
    store,
    defaultCreditEstimateValidator(),
    clockValue,
    [],
    defaultCreditEstimateEngine(flagsValue),
  );
}
