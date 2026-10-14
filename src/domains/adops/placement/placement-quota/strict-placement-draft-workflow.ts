import * as clock from "../../../../kit/clock.js";
import {
  StrictPlacementDraftValidator,
  defaultStrictPlacementDraftValidator,
} from "./strict-placement-draft-rules.js";
import { StrictPlacementDraftStore } from "./strict-placement-draft-store.js";

/** Moves strict placement drafts through their life cycle and keeps a journal of what it did. */
export class StrictPlacementDraftCoordinator {
  store: StrictPlacementDraftStore;
  validator: StrictPlacementDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictPlacementDraftStore,
    validator: StrictPlacementDraftValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict placement draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict placement draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newStrictPlacementDraftCoordinator(store: StrictPlacementDraftStore, clockValue: clock.Clock): StrictPlacementDraftCoordinator {
  return new StrictPlacementDraftCoordinator(store, defaultStrictPlacementDraftValidator(), clockValue, []);
}
