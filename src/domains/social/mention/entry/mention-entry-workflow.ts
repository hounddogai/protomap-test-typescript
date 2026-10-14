import * as clock from "../../../../kit/clock.js";
import { MentionEntryValidator, defaultMentionEntryValidator } from "./mention-entry-rules.js";
import { MentionEntryStore } from "./mention-entry-store.js";

/** Moves mention entries through their life cycle and keeps a journal of what it did. */
export class MentionEntryWorkflow {
  store: MentionEntryStore;
  validator: MentionEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: MentionEntryStore,
    validator: MentionEntryValidator,
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
      throw new Error(`mention entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newMentionEntryWorkflow(store: MentionEntryStore, clockValue: clock.Clock): MentionEntryWorkflow {
  return new MentionEntryWorkflow(store, defaultMentionEntryValidator(), clockValue, []);
}
