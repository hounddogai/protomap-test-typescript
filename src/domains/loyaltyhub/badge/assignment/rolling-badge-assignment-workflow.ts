import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingBadgeAssignmentEngine,
  defaultRollingBadgeAssignmentEngine,
} from "./rolling-badge-assignment-engine.js";
import {
  RollingBadgeAssignmentValidator,
  defaultRollingBadgeAssignmentValidator,
} from "./rolling-badge-assignment-rules.js";
import { RollingBadgeAssignmentStore } from "./rolling-badge-assignment-store.js";

/** Moves rolling badge assignments through their life cycle and keeps a journal of what it did. */
export class RollingBadgeAssignmentWorkflow {
  store: RollingBadgeAssignmentStore;
  validator: RollingBadgeAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingBadgeAssignmentEngine;

  constructor(
    store: RollingBadgeAssignmentStore,
    validator: RollingBadgeAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingBadgeAssignmentEngine,
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
      throw new Error(`rolling badge assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling badge assignment ${code} not found`);
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
      throw new Error(`rolling badge assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRollingBadgeAssignmentWorkflow(store: RollingBadgeAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingBadgeAssignmentWorkflow {
  return new RollingBadgeAssignmentWorkflow(
    store,
    defaultRollingBadgeAssignmentValidator(),
    clockValue,
    [],
    defaultRollingBadgeAssignmentEngine(flagsValue),
  );
}
