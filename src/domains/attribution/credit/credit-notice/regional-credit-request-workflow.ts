import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalCreditRequestEngine, defaultRegionalCreditRequestEngine } from "./regional-credit-request-engine.js";
import {
  RegionalCreditRequestValidator,
  defaultRegionalCreditRequestValidator,
} from "./regional-credit-request-rules.js";
import { RegionalCreditRequestStore } from "./regional-credit-request-store.js";

/** Moves regional credit requests through their life cycle and keeps a journal of what it did. */
export class RegionalCreditRequestWorkflow {
  store: RegionalCreditRequestStore;
  validator: RegionalCreditRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalCreditRequestEngine;

  constructor(
    store: RegionalCreditRequestStore,
    validator: RegionalCreditRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalCreditRequestEngine,
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
      throw new Error(`regional credit request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional credit request ${code} not found`);
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
      throw new Error(`regional credit request ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRegionalCreditRequestWorkflow(store: RegionalCreditRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalCreditRequestWorkflow {
  return new RegionalCreditRequestWorkflow(
    store,
    defaultRegionalCreditRequestValidator(),
    clockValue,
    [],
    defaultRegionalCreditRequestEngine(flagsValue),
  );
}
