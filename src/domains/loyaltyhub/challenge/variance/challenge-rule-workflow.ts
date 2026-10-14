import * as clock from "../../../../kit/clock.js";
import { ChallengeRuleEngine, defaultChallengeRuleEngine } from "./challenge-rule-engine.js";
import { ChallengeRuleValidator, defaultChallengeRuleValidator } from "./challenge-rule-rules.js";
import { ChallengeRuleStore } from "./challenge-rule-store.js";

/** Moves challenge rules through their life cycle and keeps a journal of what it did. */
export class ChallengeRuleService {
  store: ChallengeRuleStore;
  validator: ChallengeRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeRuleEngine;

  constructor(
    store: ChallengeRuleStore,
    validator: ChallengeRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeRuleEngine,
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
      throw new Error(`challenge rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge rule ${code} not found`);
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
      throw new Error(`challenge rule ${code} not found`);
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

export function newChallengeRuleService(store: ChallengeRuleStore, clockValue: clock.Clock): ChallengeRuleService {
  return new ChallengeRuleService(store, defaultChallengeRuleValidator(), clockValue, [], defaultChallengeRuleEngine());
}
