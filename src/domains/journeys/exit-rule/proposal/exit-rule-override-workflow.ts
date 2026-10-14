import * as clock from "../../../../kit/clock.js";
import { ExitRuleOverrideValidator, defaultExitRuleOverrideValidator } from "./exit-rule-override-rules.js";
import { ExitRuleOverrideStore } from "./exit-rule-override-store.js";

/** Moves exit rule overrides through their life cycle and keeps a journal of what it did. */
export class ExitRuleOverrideService {
  store: ExitRuleOverrideStore;
  validator: ExitRuleOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ExitRuleOverrideStore,
    validator: ExitRuleOverrideValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newExitRuleOverrideService(store: ExitRuleOverrideStore, clockValue: clock.Clock): ExitRuleOverrideService {
  return new ExitRuleOverrideService(store, defaultExitRuleOverrideValidator(), clockValue, []);
}
