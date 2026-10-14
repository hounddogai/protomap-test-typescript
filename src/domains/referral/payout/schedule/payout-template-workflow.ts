import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutTemplateEngine, defaultPayoutTemplateEngine } from "./payout-template-engine.js";
import { PayoutTemplateValidator, defaultPayoutTemplateValidator } from "./payout-template-rules.js";
import { PayoutTemplateStore } from "./payout-template-store.js";

/** Moves payout templates through their life cycle and keeps a journal of what it did. */
export class PayoutTemplateWorkflow {
  store: PayoutTemplateStore;
  validator: PayoutTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutTemplateEngine;

  constructor(
    store: PayoutTemplateStore,
    validator: PayoutTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutTemplateEngine,
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
      throw new Error(`payout template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPayoutTemplateWorkflow(store: PayoutTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutTemplateWorkflow {
  return new PayoutTemplateWorkflow(
    store,
    defaultPayoutTemplateValidator(),
    clockValue,
    [],
    defaultPayoutTemplateEngine(flagsValue),
  );
}
