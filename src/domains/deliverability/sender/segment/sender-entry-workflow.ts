import * as clock from "../../../../kit/clock.js";
import { SenderEntryValidator, defaultSenderEntryValidator } from "./sender-entry-rules.js";
import { SenderEntryStore } from "./sender-entry-store.js";

/** Moves sender entries through their life cycle and keeps a journal of what it did. */
export class SenderEntryWorkflow {
  store: SenderEntryStore;
  validator: SenderEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SenderEntryStore,
    validator: SenderEntryValidator,
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
      throw new Error(`sender entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newSenderEntryWorkflow(store: SenderEntryStore, clockValue: clock.Clock): SenderEntryWorkflow {
  return new SenderEntryWorkflow(store, defaultSenderEntryValidator(), clockValue, []);
}
