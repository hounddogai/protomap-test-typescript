import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryMentionRuleEngine, defaultPrimaryMentionRuleEngine } from "./primary-mention-rule-engine.js";
import { PrimaryMentionRuleValidator, defaultPrimaryMentionRuleValidator } from "./primary-mention-rule-rules.js";
import { PrimaryMentionRuleStore } from "./primary-mention-rule-store.js";

/** Moves primary mention rules through their life cycle and keeps a journal of what it did. */
export class PrimaryMentionRuleWorkflow {
  store: PrimaryMentionRuleStore;
  validator: PrimaryMentionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryMentionRuleEngine;

  constructor(
    store: PrimaryMentionRuleStore,
    validator: PrimaryMentionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryMentionRuleEngine,
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
      throw new Error(`primary mention rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary mention rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary mention rule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPrimaryMentionRuleWorkflow(store: PrimaryMentionRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryMentionRuleWorkflow {
  return new PrimaryMentionRuleWorkflow(
    store,
    defaultPrimaryMentionRuleValidator(),
    clockValue,
    [],
    defaultPrimaryMentionRuleEngine(flagsValue),
  );
}
