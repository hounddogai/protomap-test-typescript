import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RedemptionTemplateEngine, defaultRedemptionTemplateEngine } from "./redemption-template-engine.js";
import { RedemptionTemplateValidator, defaultRedemptionTemplateValidator } from "./redemption-template-rules.js";
import { RedemptionTemplateStore } from "./redemption-template-store.js";

/** Moves redemption templates through their life cycle and keeps a journal of what it did. */
export class RedemptionTemplateWorkflow {
  store: RedemptionTemplateStore;
  validator: RedemptionTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionTemplateEngine;

  constructor(
    store: RedemptionTemplateStore,
    validator: RedemptionTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionTemplateEngine,
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
      throw new Error(`redemption template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption template ${code} not found`);
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
      throw new Error(`redemption template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRedemptionTemplateWorkflow(store: RedemptionTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): RedemptionTemplateWorkflow {
  return new RedemptionTemplateWorkflow(
    store,
    defaultRedemptionTemplateValidator(),
    clockValue,
    [],
    defaultRedemptionTemplateEngine(flagsValue),
  );
}
