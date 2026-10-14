import * as clock from "../../../../kit/clock.js";
import { StrictDomainRecordValidator, defaultStrictDomainRecordValidator } from "./strict-domain-record-rules.js";
import { StrictDomainRecordStore } from "./strict-domain-record-store.js";

/** Moves strict domain records through their life cycle and keeps a journal of what it did. */
export class StrictDomainRecordDesk {
  store: StrictDomainRecordStore;
  validator: StrictDomainRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictDomainRecordStore,
    validator: StrictDomainRecordValidator,
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
      throw new Error(`strict domain record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict domain record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newStrictDomainRecordDesk(store: StrictDomainRecordStore, clockValue: clock.Clock): StrictDomainRecordDesk {
  return new StrictDomainRecordDesk(store, defaultStrictDomainRecordValidator(), clockValue, []);
}
