import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualBadgeMilestoneEngine, defaultManualBadgeMilestoneEngine } from "./manual-badge-milestone-engine.js";
import {
  ManualBadgeMilestoneValidator,
  defaultManualBadgeMilestoneValidator,
} from "./manual-badge-milestone-rules.js";
import { ManualBadgeMilestoneStore } from "./manual-badge-milestone-store.js";

/** Moves manual badge milestones through their life cycle and keeps a journal of what it did. */
export class ManualBadgeMilestoneCoordinator {
  store: ManualBadgeMilestoneStore;
  validator: ManualBadgeMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualBadgeMilestoneEngine;

  constructor(
    store: ManualBadgeMilestoneStore,
    validator: ManualBadgeMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualBadgeMilestoneEngine,
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
      throw new Error(`manual badge milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual badge milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual badge milestone ${code} not found`);
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

export function newManualBadgeMilestoneCoordinator(store: ManualBadgeMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualBadgeMilestoneCoordinator {
  return new ManualBadgeMilestoneCoordinator(
    store,
    defaultManualBadgeMilestoneValidator(),
    clockValue,
    [],
    defaultManualBadgeMilestoneEngine(flagsValue),
  );
}
