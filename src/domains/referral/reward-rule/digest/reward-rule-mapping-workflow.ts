import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleMappingEngine, defaultRewardRuleMappingEngine } from "./reward-rule-mapping-engine.js";
import { RewardRuleMappingValidator, defaultRewardRuleMappingValidator } from "./reward-rule-mapping-rules.js";
import { RewardRuleMappingStore } from "./reward-rule-mapping-store.js";

/** Moves reward rule mappings through their life cycle and keeps a journal of what it did. */
export class RewardRuleMappingWorkflow {
  store: RewardRuleMappingStore;
  validator: RewardRuleMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleMappingEngine;

  constructor(
    store: RewardRuleMappingStore,
    validator: RewardRuleMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleMappingEngine,
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
      throw new Error(`reward rule mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule mapping ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRewardRuleMappingWorkflow(store: RewardRuleMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleMappingWorkflow {
  return new RewardRuleMappingWorkflow(
    store,
    defaultRewardRuleMappingValidator(),
    clockValue,
    [],
    defaultRewardRuleMappingEngine(flagsValue),
  );
}
