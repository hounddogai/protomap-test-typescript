import * as clock from "../../../../kit/clock.js";
import { ConversionRuleValidator, defaultConversionRuleValidator } from "./conversion-rule-rules.js";
import { ConversionRuleStore } from "./conversion-rule-store.js";

/** Moves conversion rules through their life cycle and keeps a journal of what it did. */
export class ConversionRuleDesk {
  store: ConversionRuleStore;
  validator: ConversionRuleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ConversionRuleStore,
    validator: ConversionRuleValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newConversionRuleDesk(store: ConversionRuleStore, clockValue: clock.Clock): ConversionRuleDesk {
  return new ConversionRuleDesk(store, defaultConversionRuleValidator(), clockValue, []);
}
