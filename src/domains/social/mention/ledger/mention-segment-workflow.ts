import * as clock from "../../../../kit/clock.js";
import { MentionSegmentValidator, defaultMentionSegmentValidator } from "./mention-segment-rules.js";
import { MentionSegmentStore } from "./mention-segment-store.js";

/** Moves mention segments through their life cycle and keeps a journal of what it did. */
export class MentionSegmentCoordinator {
  store: MentionSegmentStore;
  validator: MentionSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: MentionSegmentStore,
    validator: MentionSegmentValidator,
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
      throw new Error(`mention segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention segment ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newMentionSegmentCoordinator(store: MentionSegmentStore, clockValue: clock.Clock): MentionSegmentCoordinator {
  return new MentionSegmentCoordinator(store, defaultMentionSegmentValidator(), clockValue, []);
}
