import * as clock from "../../../../kit/clock.js";
import {
  WeightedInsightDraftValidator,
  defaultWeightedInsightDraftValidator,
} from "./weighted-insight-draft-rules.js";
import { WeightedInsightDraftStore } from "./weighted-insight-draft-store.js";

/** Moves weighted insight drafts through their life cycle and keeps a journal of what it did. */
export class WeightedInsightDraftManager {
  store: WeightedInsightDraftStore;
  validator: WeightedInsightDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedInsightDraftStore,
    validator: WeightedInsightDraftValidator,
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
      throw new Error(`weighted insight draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted insight draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newWeightedInsightDraftManager(store: WeightedInsightDraftStore, clockValue: clock.Clock): WeightedInsightDraftManager {
  return new WeightedInsightDraftManager(store, defaultWeightedInsightDraftValidator(), clockValue, []);
}
