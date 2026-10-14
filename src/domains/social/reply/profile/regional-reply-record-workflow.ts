import * as clock from "../../../../kit/clock.js";
import { RegionalReplyRecordValidator, defaultRegionalReplyRecordValidator } from "./regional-reply-record-rules.js";
import { RegionalReplyRecordStore } from "./regional-reply-record-store.js";

/** Moves regional reply records through their life cycle and keeps a journal of what it did. */
export class RegionalReplyRecordWorkflow {
  store: RegionalReplyRecordStore;
  validator: RegionalReplyRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalReplyRecordStore,
    validator: RegionalReplyRecordValidator,
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
      throw new Error(`regional reply record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reply record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalReplyRecordWorkflow(store: RegionalReplyRecordStore, clockValue: clock.Clock): RegionalReplyRecordWorkflow {
  return new RegionalReplyRecordWorkflow(store, defaultRegionalReplyRecordValidator(), clockValue, []);
}
