import * as clock from "../../../../kit/clock.js";
import {
  WeightedEscalationMilestoneEngine,
  defaultWeightedEscalationMilestoneEngine,
} from "./weighted-escalation-milestone-engine.js";
import {
  WeightedEscalationMilestoneValidator,
  defaultWeightedEscalationMilestoneValidator,
} from "./weighted-escalation-milestone-rules.js";
import { WeightedEscalationMilestoneStore } from "./weighted-escalation-milestone-store.js";

/** Moves weighted escalation milestones through their life cycle and keeps a journal of what it did. */
export class WeightedEscalationMilestoneService {
  store: WeightedEscalationMilestoneStore;
  validator: WeightedEscalationMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedEscalationMilestoneEngine;

  constructor(
    store: WeightedEscalationMilestoneStore,
    validator: WeightedEscalationMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedEscalationMilestoneEngine,
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
      throw new Error(`weighted escalation milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted escalation milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted escalation milestone ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newWeightedEscalationMilestoneService(store: WeightedEscalationMilestoneStore, clockValue: clock.Clock): WeightedEscalationMilestoneService {
  return new WeightedEscalationMilestoneService(
    store,
    defaultWeightedEscalationMilestoneValidator(),
    clockValue,
    [],
    defaultWeightedEscalationMilestoneEngine(),
  );
}
