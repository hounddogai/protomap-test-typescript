import * as clock from "../../../../kit/clock.js";
import {
  AdaptivePlacementGroupValidator,
  defaultAdaptivePlacementGroupValidator,
} from "./adaptive-placement-group-rules.js";
import { AdaptivePlacementGroupStore } from "./adaptive-placement-group-store.js";

/** Moves adaptive placement groups through their life cycle and keeps a journal of what it did. */
export class AdaptivePlacementGroupService {
  store: AdaptivePlacementGroupStore;
  validator: AdaptivePlacementGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptivePlacementGroupStore,
    validator: AdaptivePlacementGroupValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newAdaptivePlacementGroupService(store: AdaptivePlacementGroupStore, clockValue: clock.Clock): AdaptivePlacementGroupService {
  return new AdaptivePlacementGroupService(store, defaultAdaptivePlacementGroupValidator(), clockValue, []);
}
