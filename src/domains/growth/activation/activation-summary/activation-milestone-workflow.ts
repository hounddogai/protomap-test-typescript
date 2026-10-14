import * as clock from "../../../../kit/clock.js";
import { ActivationMilestoneEngine, defaultActivationMilestoneEngine } from "./activation-milestone-engine.js";
import { ActivationMilestoneValidator, defaultActivationMilestoneValidator } from "./activation-milestone-rules.js";
import { ActivationMilestoneStore } from "./activation-milestone-store.js";

/** Moves activation milestones through their life cycle and keeps a journal of what it did. */
export class ActivationMilestoneDesk {
  store: ActivationMilestoneStore;
  validator: ActivationMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationMilestoneEngine;

  constructor(
    store: ActivationMilestoneStore,
    validator: ActivationMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationMilestoneEngine,
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
      throw new Error(`activation milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newActivationMilestoneDesk(store: ActivationMilestoneStore, clockValue: clock.Clock): ActivationMilestoneDesk {
  return new ActivationMilestoneDesk(
    store,
    defaultActivationMilestoneValidator(),
    clockValue,
    [],
    defaultActivationMilestoneEngine(),
  );
}
