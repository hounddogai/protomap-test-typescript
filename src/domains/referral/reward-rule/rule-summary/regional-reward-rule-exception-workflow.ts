import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalRewardRuleExceptionEngine,
  defaultRegionalRewardRuleExceptionEngine,
} from "./regional-reward-rule-exception-engine.js";
import {
  RegionalRewardRuleExceptionValidator,
  defaultRegionalRewardRuleExceptionValidator,
} from "./regional-reward-rule-exception-rules.js";
import { RegionalRewardRuleExceptionStore } from "./regional-reward-rule-exception-store.js";

/** Moves regional reward rule exceptions through their life cycle and keeps a journal of what it did. */
export class RegionalRewardRuleExceptionDesk {
  store: RegionalRewardRuleExceptionStore;
  validator: RegionalRewardRuleExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalRewardRuleExceptionEngine;

  constructor(
    store: RegionalRewardRuleExceptionStore,
    validator: RegionalRewardRuleExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalRewardRuleExceptionEngine,
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
      throw new Error(`regional reward rule exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reward rule exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reward rule exception ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRegionalRewardRuleExceptionDesk(store: RegionalRewardRuleExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalRewardRuleExceptionDesk {
  return new RegionalRewardRuleExceptionDesk(
    store,
    defaultRegionalRewardRuleExceptionValidator(),
    clockValue,
    [],
    defaultRegionalRewardRuleExceptionEngine(flagsValue),
  );
}
