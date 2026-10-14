import * as clock from "../../../../kit/clock.js";
import { DeflectionRuleValidator, defaultDeflectionRuleValidator } from "./deflection-rule-rules.js";
import { DeflectionRuleStore } from "./deflection-rule-store.js";

/** Moves deflection rules through their life cycle and keeps a journal of what it did. */
export class DeflectionRuleCoordinator {
  store: DeflectionRuleStore;
  validator: DeflectionRuleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DeflectionRuleStore,
    validator: DeflectionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDeflectionRuleCoordinator(store: DeflectionRuleStore, clockValue: clock.Clock): DeflectionRuleCoordinator {
  return new DeflectionRuleCoordinator(store, defaultDeflectionRuleValidator(), clockValue, []);
}
