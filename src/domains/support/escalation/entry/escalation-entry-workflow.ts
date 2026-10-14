import * as clock from "../../../../kit/clock.js";
import { EscalationEntryValidator, defaultEscalationEntryValidator } from "./escalation-entry-rules.js";
import { EscalationEntryStore } from "./escalation-entry-store.js";

/** Moves escalation entries through their life cycle and keeps a journal of what it did. */
export class EscalationEntryWorkflow {
  store: EscalationEntryStore;
  validator: EscalationEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: EscalationEntryStore,
    validator: EscalationEntryValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEscalationEntryWorkflow(store: EscalationEntryStore, clockValue: clock.Clock): EscalationEntryWorkflow {
  return new EscalationEntryWorkflow(store, defaultEscalationEntryValidator(), clockValue, []);
}
