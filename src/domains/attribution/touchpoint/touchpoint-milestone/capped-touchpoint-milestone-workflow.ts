import * as clock from "../../../../kit/clock.js";
import {
  CappedTouchpointMilestoneValidator,
  defaultCappedTouchpointMilestoneValidator,
} from "./capped-touchpoint-milestone-rules.js";
import { CappedTouchpointMilestoneStore } from "./capped-touchpoint-milestone-store.js";

/** Moves capped touchpoint milestones through their life cycle and keeps a journal of what it did. */
export class CappedTouchpointMilestoneCoordinator {
  store: CappedTouchpointMilestoneStore;
  validator: CappedTouchpointMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedTouchpointMilestoneStore,
    validator: CappedTouchpointMilestoneValidator,
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
      throw new Error(`capped touchpoint milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped touchpoint milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newCappedTouchpointMilestoneCoordinator(store: CappedTouchpointMilestoneStore, clockValue: clock.Clock): CappedTouchpointMilestoneCoordinator {
  return new CappedTouchpointMilestoneCoordinator(store, defaultCappedTouchpointMilestoneValidator(), clockValue, []);
}
