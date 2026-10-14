import * as clock from "../../../../kit/clock.js";
import {
  GlobalSuppressionRecordValidator,
  defaultGlobalSuppressionRecordValidator,
} from "./global-suppression-record-rules.js";
import { GlobalSuppressionRecordStore } from "./global-suppression-record-store.js";

/** Moves global suppression records through their life cycle and keeps a journal of what it did. */
export class GlobalSuppressionRecordWorkflow {
  store: GlobalSuppressionRecordStore;
  validator: GlobalSuppressionRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalSuppressionRecordStore,
    validator: GlobalSuppressionRecordValidator,
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
      throw new Error(`global suppression record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global suppression record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newGlobalSuppressionRecordWorkflow(store: GlobalSuppressionRecordStore, clockValue: clock.Clock): GlobalSuppressionRecordWorkflow {
  return new GlobalSuppressionRecordWorkflow(store, defaultGlobalSuppressionRecordValidator(), clockValue, []);
}
