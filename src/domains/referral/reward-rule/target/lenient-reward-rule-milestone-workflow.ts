import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientRewardRuleMilestoneEngine,
  defaultLenientRewardRuleMilestoneEngine,
} from "./lenient-reward-rule-milestone-engine.js";
import {
  LenientRewardRuleMilestoneValidator,
  defaultLenientRewardRuleMilestoneValidator,
} from "./lenient-reward-rule-milestone-rules.js";
import { LenientRewardRuleMilestoneStore } from "./lenient-reward-rule-milestone-store.js";

/** Moves lenient reward rule milestones through their life cycle and keeps a journal of what it did. */
export class LenientRewardRuleMilestoneWorkflow {
  store: LenientRewardRuleMilestoneStore;
  validator: LenientRewardRuleMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientRewardRuleMilestoneEngine;

  constructor(
    store: LenientRewardRuleMilestoneStore,
    validator: LenientRewardRuleMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientRewardRuleMilestoneEngine,
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
      throw new Error(`lenient reward rule milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward rule milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward rule milestone ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newLenientRewardRuleMilestoneWorkflow(store: LenientRewardRuleMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientRewardRuleMilestoneWorkflow {
  return new LenientRewardRuleMilestoneWorkflow(
    store,
    defaultLenientRewardRuleMilestoneValidator(),
    clockValue,
    [],
    defaultLenientRewardRuleMilestoneEngine(flagsValue),
  );
}
