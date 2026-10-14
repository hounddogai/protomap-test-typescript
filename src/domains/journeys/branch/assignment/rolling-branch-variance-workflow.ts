import * as clock from "../../../../kit/clock.js";
import {
  RollingBranchVarianceValidator,
  defaultRollingBranchVarianceValidator,
} from "./rolling-branch-variance-rules.js";
import { RollingBranchVarianceStore } from "./rolling-branch-variance-store.js";

/** Moves rolling branch variances through their life cycle and keeps a journal of what it did. */
export class RollingBranchVarianceService {
  store: RollingBranchVarianceStore;
  validator: RollingBranchVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingBranchVarianceStore,
    validator: RollingBranchVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling branch variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling branch variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRollingBranchVarianceService(store: RollingBranchVarianceStore, clockValue: clock.Clock): RollingBranchVarianceService {
  return new RollingBranchVarianceService(store, defaultRollingBranchVarianceValidator(), clockValue, []);
}
