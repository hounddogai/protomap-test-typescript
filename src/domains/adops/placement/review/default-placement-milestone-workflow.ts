import * as clock from "../../../../kit/clock.js";
import {
  DefaultPlacementMilestoneValidator,
  defaultDefaultPlacementMilestoneValidator,
} from "./default-placement-milestone-rules.js";
import { DefaultPlacementMilestoneStore } from "./default-placement-milestone-store.js";

/** Moves default placement milestones through their life cycle and keeps a journal of what it did. */
export class DefaultPlacementMilestoneCoordinator {
  store: DefaultPlacementMilestoneStore;
  validator: DefaultPlacementMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultPlacementMilestoneStore,
    validator: DefaultPlacementMilestoneValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default placement milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default placement milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newDefaultPlacementMilestoneCoordinator(store: DefaultPlacementMilestoneStore, clockValue: clock.Clock): DefaultPlacementMilestoneCoordinator {
  return new DefaultPlacementMilestoneCoordinator(store, defaultDefaultPlacementMilestoneValidator(), clockValue, []);
}
