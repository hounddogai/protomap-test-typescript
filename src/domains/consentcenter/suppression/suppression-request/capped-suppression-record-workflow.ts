import * as clock from "../../../../kit/clock.js";
import {
  CappedSuppressionRecordValidator,
  defaultCappedSuppressionRecordValidator,
} from "./capped-suppression-record-rules.js";
import { CappedSuppressionRecordStore } from "./capped-suppression-record-store.js";

/** Moves capped suppression records through their life cycle and keeps a journal of what it did. */
export class CappedSuppressionRecordService {
  store: CappedSuppressionRecordStore;
  validator: CappedSuppressionRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedSuppressionRecordStore,
    validator: CappedSuppressionRecordValidator,
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
      throw new Error(`capped suppression record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped suppression record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newCappedSuppressionRecordService(store: CappedSuppressionRecordStore, clockValue: clock.Clock): CappedSuppressionRecordService {
  return new CappedSuppressionRecordService(store, defaultCappedSuppressionRecordValidator(), clockValue, []);
}
