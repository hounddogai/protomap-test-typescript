import * as clock from "../../../../kit/clock.js";
import {
  DefaultTouchpointRecordValidator,
  defaultDefaultTouchpointRecordValidator,
} from "./default-touchpoint-record-rules.js";
import { DefaultTouchpointRecordStore } from "./default-touchpoint-record-store.js";

/** Moves default touchpoint records through their life cycle and keeps a journal of what it did. */
export class DefaultTouchpointRecordService {
  store: DefaultTouchpointRecordStore;
  validator: DefaultTouchpointRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultTouchpointRecordStore,
    validator: DefaultTouchpointRecordValidator,
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
      throw new Error(`default touchpoint record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default touchpoint record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultTouchpointRecordService(store: DefaultTouchpointRecordStore, clockValue: clock.Clock): DefaultTouchpointRecordService {
  return new DefaultTouchpointRecordService(store, defaultDefaultTouchpointRecordValidator(), clockValue, []);
}
