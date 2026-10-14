import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleScheduleEngine, defaultRewardRuleScheduleEngine } from "./reward-rule-schedule-engine.js";
import { RewardRuleScheduleValidator, defaultRewardRuleScheduleValidator } from "./reward-rule-schedule-rules.js";
import { RewardRuleScheduleStore } from "./reward-rule-schedule-store.js";

/** Moves reward rule schedules through their life cycle and keeps a journal of what it did. */
export class RewardRuleScheduleDesk {
  store: RewardRuleScheduleStore;
  validator: RewardRuleScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleScheduleEngine;

  constructor(
    store: RewardRuleScheduleStore,
    validator: RewardRuleScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleScheduleEngine,
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
      throw new Error(`reward rule schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule schedule ${code} not found`);
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
      throw new Error(`reward rule schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newRewardRuleScheduleDesk(store: RewardRuleScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleScheduleDesk {
  return new RewardRuleScheduleDesk(
    store,
    defaultRewardRuleScheduleValidator(),
    clockValue,
    [],
    defaultRewardRuleScheduleEngine(flagsValue),
  );
}
