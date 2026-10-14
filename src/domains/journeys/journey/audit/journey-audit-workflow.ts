import * as clock from "../../../../kit/clock.js";
import { JourneyAuditValidator, defaultJourneyAuditValidator } from "./journey-audit-rules.js";
import { JourneyAuditStore } from "./journey-audit-store.js";

/** Moves journey audits through their life cycle and keeps a journal of what it did. */
export class JourneyAuditWorkflow {
  store: JourneyAuditStore;
  validator: JourneyAuditValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: JourneyAuditStore,
    validator: JourneyAuditValidator,
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
      throw new Error(`journey audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newJourneyAuditWorkflow(store: JourneyAuditStore, clockValue: clock.Clock): JourneyAuditWorkflow {
  return new JourneyAuditWorkflow(store, defaultJourneyAuditValidator(), clockValue, []);
}
