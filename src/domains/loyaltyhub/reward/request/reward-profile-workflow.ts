import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardProfileEngine, defaultRewardProfileEngine } from "./reward-profile-engine.js";
import { RewardProfileValidator, defaultRewardProfileValidator } from "./reward-profile-rules.js";
import { RewardProfileStore } from "./reward-profile-store.js";

/** Moves reward profiles through their life cycle and keeps a journal of what it did. */
export class RewardProfileWorkflow {
  store: RewardProfileStore;
  validator: RewardProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardProfileEngine;

  constructor(
    store: RewardProfileStore,
    validator: RewardProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardProfileEngine,
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
      throw new Error(`reward profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward profile ${code} not found`);
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

export function newRewardProfileWorkflow(store: RewardProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardProfileWorkflow {
  return new RewardProfileWorkflow(
    store,
    defaultRewardProfileValidator(),
    clockValue,
    [],
    defaultRewardProfileEngine(flagsValue),
  );
}
