import * as clock from "../../../../kit/clock.js";
import { ExitRuleCheckpointEngine, defaultExitRuleCheckpointEngine } from "./exit-rule-checkpoint-engine.js";
import { ExitRuleCheckpointValidator, defaultExitRuleCheckpointValidator } from "./exit-rule-checkpoint-rules.js";
import { ExitRuleCheckpointStore } from "./exit-rule-checkpoint-store.js";

/** Moves exit rule checkpoints through their life cycle and keeps a journal of what it did. */
export class ExitRuleCheckpointCoordinator {
  store: ExitRuleCheckpointStore;
  validator: ExitRuleCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleCheckpointEngine;

  constructor(
    store: ExitRuleCheckpointStore,
    validator: ExitRuleCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleCheckpointEngine,
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
      throw new Error(`exit rule checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule checkpoint ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newExitRuleCheckpointCoordinator(store: ExitRuleCheckpointStore, clockValue: clock.Clock): ExitRuleCheckpointCoordinator {
  return new ExitRuleCheckpointCoordinator(
    store,
    defaultExitRuleCheckpointValidator(),
    clockValue,
    [],
    defaultExitRuleCheckpointEngine(),
  );
}
