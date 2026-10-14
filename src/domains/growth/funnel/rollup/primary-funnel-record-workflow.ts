import * as clock from "../../../../kit/clock.js";
import { PrimaryFunnelRecordValidator, defaultPrimaryFunnelRecordValidator } from "./primary-funnel-record-rules.js";
import { PrimaryFunnelRecordStore } from "./primary-funnel-record-store.js";

/** Moves primary funnel records through their life cycle and keeps a journal of what it did. */
export class PrimaryFunnelRecordService {
  store: PrimaryFunnelRecordStore;
  validator: PrimaryFunnelRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryFunnelRecordStore,
    validator: PrimaryFunnelRecordValidator,
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
      throw new Error(`primary funnel record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary funnel record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newPrimaryFunnelRecordService(store: PrimaryFunnelRecordStore, clockValue: clock.Clock): PrimaryFunnelRecordService {
  return new PrimaryFunnelRecordService(store, defaultPrimaryFunnelRecordValidator(), clockValue, []);
}
