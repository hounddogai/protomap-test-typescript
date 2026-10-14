import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightPolicyEngine, defaultInsightPolicyEngine } from "./insight-policy-engine.js";
import { InsightPolicyValidator, defaultInsightPolicyValidator } from "./insight-policy-rules.js";
import { InsightPolicyStore } from "./insight-policy-store.js";

/** Moves insight policies through their life cycle and keeps a journal of what it did. */
export class InsightPolicyManager {
  store: InsightPolicyStore;
  validator: InsightPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightPolicyEngine;

  constructor(
    store: InsightPolicyStore,
    validator: InsightPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightPolicyEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight policy ${code} not found`);
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
      throw new Error(`insight policy ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newInsightPolicyManager(store: InsightPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightPolicyManager {
  return new InsightPolicyManager(
    store,
    defaultInsightPolicyValidator(),
    clockValue,
    [],
    defaultInsightPolicyEngine(flagsValue),
  );
}
