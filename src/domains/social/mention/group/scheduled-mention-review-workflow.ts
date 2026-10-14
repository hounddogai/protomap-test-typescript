import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledMentionReviewEngine,
  defaultScheduledMentionReviewEngine,
} from "./scheduled-mention-review-engine.js";
import {
  ScheduledMentionReviewValidator,
  defaultScheduledMentionReviewValidator,
} from "./scheduled-mention-review-rules.js";
import { ScheduledMentionReviewStore } from "./scheduled-mention-review-store.js";

/** Moves scheduled mention reviews through their life cycle and keeps a journal of what it did. */
export class ScheduledMentionReviewService {
  store: ScheduledMentionReviewStore;
  validator: ScheduledMentionReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledMentionReviewEngine;

  constructor(
    store: ScheduledMentionReviewStore,
    validator: ScheduledMentionReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledMentionReviewEngine,
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
      throw new Error(`scheduled mention review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled mention review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled mention review ${code} not found`);
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

export function newScheduledMentionReviewService(store: ScheduledMentionReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledMentionReviewService {
  return new ScheduledMentionReviewService(
    store,
    defaultScheduledMentionReviewValidator(),
    clockValue,
    [],
    defaultScheduledMentionReviewEngine(flagsValue),
  );
}
