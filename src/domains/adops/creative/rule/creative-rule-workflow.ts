import * as clock from "../../../../kit/clock.js";
import { CreativeRuleEngine, defaultCreativeRuleEngine } from "./creative-rule-engine.js";
import { CreativeRuleValidator, defaultCreativeRuleValidator } from "./creative-rule-rules.js";
import { CreativeRuleStore } from "./creative-rule-store.js";

/** Moves creative rules through their life cycle and keeps a journal of what it did. */
export class CreativeRuleService {
  store: CreativeRuleStore;
  validator: CreativeRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeRuleEngine;

  constructor(
    store: CreativeRuleStore,
    validator: CreativeRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeRuleEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative rule ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCreativeRuleService(store: CreativeRuleStore, clockValue: clock.Clock): CreativeRuleService {
  return new CreativeRuleService(store, defaultCreativeRuleValidator(), clockValue, [], defaultCreativeRuleEngine());
}
