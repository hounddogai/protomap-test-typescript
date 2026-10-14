import * as clock from "../../../../kit/clock.js";
import { PrimaryPathRecordValidator, defaultPrimaryPathRecordValidator } from "./primary-path-record-rules.js";
import { PrimaryPathRecordStore } from "./primary-path-record-store.js";

/** Moves primary path records through their life cycle and keeps a journal of what it did. */
export class PrimaryPathRecordService {
  store: PrimaryPathRecordStore;
  validator: PrimaryPathRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryPathRecordStore,
    validator: PrimaryPathRecordValidator,
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
      throw new Error(`primary path record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary path record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newPrimaryPathRecordService(store: PrimaryPathRecordStore, clockValue: clock.Clock): PrimaryPathRecordService {
  return new PrimaryPathRecordService(store, defaultPrimaryPathRecordValidator(), clockValue, []);
}
