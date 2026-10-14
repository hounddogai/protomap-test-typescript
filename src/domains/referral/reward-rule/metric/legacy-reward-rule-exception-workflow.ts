import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyRewardRuleExceptionEngine,
  defaultLegacyRewardRuleExceptionEngine,
} from "./legacy-reward-rule-exception-engine.js";
import {
  LegacyRewardRuleExceptionValidator,
  defaultLegacyRewardRuleExceptionValidator,
} from "./legacy-reward-rule-exception-rules.js";
import { LegacyRewardRuleExceptionStore } from "./legacy-reward-rule-exception-store.js";

/** Moves legacy reward rule exceptions through their life cycle and keeps a journal of what it did. */
export class LegacyRewardRuleExceptionManager {
  store: LegacyRewardRuleExceptionStore;
  validator: LegacyRewardRuleExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyRewardRuleExceptionEngine;

  constructor(
    store: LegacyRewardRuleExceptionStore,
    validator: LegacyRewardRuleExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyRewardRuleExceptionEngine,
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
      throw new Error(`legacy reward rule exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reward rule exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reward rule exception ${code} not found`);
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

export function newLegacyRewardRuleExceptionManager(store: LegacyRewardRuleExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyRewardRuleExceptionManager {
  return new LegacyRewardRuleExceptionManager(
    store,
    defaultLegacyRewardRuleExceptionValidator(),
    clockValue,
    [],
    defaultLegacyRewardRuleExceptionEngine(flagsValue),
  );
}
