import * as clock from "../../../../kit/clock.js";
import { MentionWindowValidator, defaultMentionWindowValidator } from "./mention-window-rules.js";
import { MentionWindowStore } from "./mention-window-store.js";

/** Moves mention windows through their life cycle and keeps a journal of what it did. */
export class MentionWindowWorkflow {
  store: MentionWindowStore;
  validator: MentionWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: MentionWindowStore,
    validator: MentionWindowValidator,
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
      throw new Error(`mention window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newMentionWindowWorkflow(store: MentionWindowStore, clockValue: clock.Clock): MentionWindowWorkflow {
  return new MentionWindowWorkflow(store, defaultMentionWindowValidator(), clockValue, []);
}
