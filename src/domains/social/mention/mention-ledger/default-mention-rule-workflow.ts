import * as clock from "../../../../kit/clock.js";
import { DefaultMentionRuleEngine, defaultDefaultMentionRuleEngine } from "./default-mention-rule-engine.js";
import { DefaultMentionRuleValidator, defaultDefaultMentionRuleValidator } from "./default-mention-rule-rules.js";
import { DefaultMentionRuleStore } from "./default-mention-rule-store.js";

/** Moves default mention rules through their life cycle and keeps a journal of what it did. */
export class DefaultMentionRuleCoordinator {
  store: DefaultMentionRuleStore;
  validator: DefaultMentionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultMentionRuleEngine;

  constructor(
    store: DefaultMentionRuleStore,
    validator: DefaultMentionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultMentionRuleEngine,
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
      throw new Error(`default mention rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default mention rule ${code} not found`);
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
      throw new Error(`default mention rule ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultMentionRuleCoordinator(store: DefaultMentionRuleStore, clockValue: clock.Clock): DefaultMentionRuleCoordinator {
  return new DefaultMentionRuleCoordinator(
    store,
    defaultDefaultMentionRuleValidator(),
    clockValue,
    [],
    defaultDefaultMentionRuleEngine(),
  );
}
