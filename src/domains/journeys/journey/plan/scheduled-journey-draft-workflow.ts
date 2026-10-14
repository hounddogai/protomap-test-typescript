import * as clock from "../../../../kit/clock.js";
import { ScheduledJourneyDraftEngine, defaultScheduledJourneyDraftEngine } from "./scheduled-journey-draft-engine.js";
import {
  ScheduledJourneyDraftValidator,
  defaultScheduledJourneyDraftValidator,
} from "./scheduled-journey-draft-rules.js";
import { ScheduledJourneyDraftStore } from "./scheduled-journey-draft-store.js";

/** Moves scheduled journey drafts through their life cycle and keeps a journal of what it did. */
export class ScheduledJourneyDraftDesk {
  store: ScheduledJourneyDraftStore;
  validator: ScheduledJourneyDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledJourneyDraftEngine;

  constructor(
    store: ScheduledJourneyDraftStore,
    validator: ScheduledJourneyDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledJourneyDraftEngine,
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
      throw new Error(`scheduled journey draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled journey draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled journey draft ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newScheduledJourneyDraftDesk(store: ScheduledJourneyDraftStore, clockValue: clock.Clock): ScheduledJourneyDraftDesk {
  return new ScheduledJourneyDraftDesk(
    store,
    defaultScheduledJourneyDraftValidator(),
    clockValue,
    [],
    defaultScheduledJourneyDraftEngine(),
  );
}
