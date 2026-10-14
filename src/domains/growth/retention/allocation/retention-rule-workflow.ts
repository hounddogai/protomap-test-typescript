import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionRuleEngine, defaultRetentionRuleEngine } from "./retention-rule-engine.js";
import { RetentionRuleValidator, defaultRetentionRuleValidator } from "./retention-rule-rules.js";
import { RetentionRuleStore } from "./retention-rule-store.js";

/** Moves retention rules through their life cycle and keeps a journal of what it did. */
export class RetentionRuleDesk {
  store: RetentionRuleStore;
  validator: RetentionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionRuleEngine;

  constructor(
    store: RetentionRuleStore,
    validator: RetentionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionRuleEngine,
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
      throw new Error(`retention rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention rule ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRetentionRuleDesk(store: RetentionRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionRuleDesk {
  return new RetentionRuleDesk(
    store,
    defaultRetentionRuleValidator(),
    clockValue,
    [],
    defaultRetentionRuleEngine(flagsValue),
  );
}
