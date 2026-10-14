import * as clock from "../../../../kit/clock.js";
import {
  RollingFraudCheckRecordValidator,
  defaultRollingFraudCheckRecordValidator,
} from "./rolling-fraud-check-record-rules.js";
import { RollingFraudCheckRecordStore } from "./rolling-fraud-check-record-store.js";

/** Moves rolling fraud check records through their life cycle and keeps a journal of what it did. */
export class RollingFraudCheckRecordService {
  store: RollingFraudCheckRecordStore;
  validator: RollingFraudCheckRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingFraudCheckRecordStore,
    validator: RollingFraudCheckRecordValidator,
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
      throw new Error(`rolling fraud check record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling fraud check record ${code} not found`);
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
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingFraudCheckRecordService(store: RollingFraudCheckRecordStore, clockValue: clock.Clock): RollingFraudCheckRecordService {
  return new RollingFraudCheckRecordService(store, defaultRollingFraudCheckRecordValidator(), clockValue, []);
}
