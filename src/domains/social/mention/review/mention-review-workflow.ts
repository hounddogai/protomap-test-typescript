import * as clock from "../../../../kit/clock.js";
import { MentionReviewValidator, defaultMentionReviewValidator } from "./mention-review-rules.js";
import { MentionReviewStore } from "./mention-review-store.js";

/** Moves mention reviews through their life cycle and keeps a journal of what it did. */
export class MentionReviewCoordinator {
  store: MentionReviewStore;
  validator: MentionReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: MentionReviewStore,
    validator: MentionReviewValidator,
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
      throw new Error(`mention review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newMentionReviewCoordinator(store: MentionReviewStore, clockValue: clock.Clock): MentionReviewCoordinator {
  return new MentionReviewCoordinator(store, defaultMentionReviewValidator(), clockValue, []);
}
