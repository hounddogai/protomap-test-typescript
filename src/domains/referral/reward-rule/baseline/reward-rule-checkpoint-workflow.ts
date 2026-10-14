import * as clock from "../../../../kit/clock.js";
import { RewardRuleCheckpointEngine, defaultRewardRuleCheckpointEngine } from "./reward-rule-checkpoint-engine.js";
import {
  RewardRuleCheckpointValidator,
  defaultRewardRuleCheckpointValidator,
} from "./reward-rule-checkpoint-rules.js";
import { RewardRuleCheckpointStore } from "./reward-rule-checkpoint-store.js";

/** Moves reward rule checkpoints through their life cycle and keeps a journal of what it did. */
export class RewardRuleCheckpointManager {
  store: RewardRuleCheckpointStore;
  validator: RewardRuleCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleCheckpointEngine;

  constructor(
    store: RewardRuleCheckpointStore,
    validator: RewardRuleCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleCheckpointEngine,
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
      throw new Error(`reward rule checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule checkpoint ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRewardRuleCheckpointManager(store: RewardRuleCheckpointStore, clockValue: clock.Clock): RewardRuleCheckpointManager {
  return new RewardRuleCheckpointManager(
    store,
    defaultRewardRuleCheckpointValidator(),
    clockValue,
    [],
    defaultRewardRuleCheckpointEngine(),
  );
}
