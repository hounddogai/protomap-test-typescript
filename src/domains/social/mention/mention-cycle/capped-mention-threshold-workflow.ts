import * as clock from "../../../../kit/clock.js";
import {
  CappedMentionThresholdValidator,
  defaultCappedMentionThresholdValidator,
} from "./capped-mention-threshold-rules.js";
import { CappedMentionThresholdStore } from "./capped-mention-threshold-store.js";

/** Moves capped mention thresholds through their life cycle and keeps a journal of what it did. */
export class CappedMentionThresholdWorkflow {
  store: CappedMentionThresholdStore;
  validator: CappedMentionThresholdValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedMentionThresholdStore,
    validator: CappedMentionThresholdValidator,
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
      throw new Error(`capped mention threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped mention threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newCappedMentionThresholdWorkflow(store: CappedMentionThresholdStore, clockValue: clock.Clock): CappedMentionThresholdWorkflow {
  return new CappedMentionThresholdWorkflow(store, defaultCappedMentionThresholdValidator(), clockValue, []);
}
