import * as clock from "../../../../kit/clock.js";
import { DefaultWaitTargetValidator, defaultDefaultWaitTargetValidator } from "./default-wait-target-rules.js";
import { DefaultWaitTargetStore } from "./default-wait-target-store.js";

/** Moves default wait targets through their life cycle and keeps a journal of what it did. */
export class DefaultWaitTargetDesk {
  store: DefaultWaitTargetStore;
  validator: DefaultWaitTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultWaitTargetStore,
    validator: DefaultWaitTargetValidator,
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
      throw new Error(`default wait target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default wait target ${code} not found`);
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

export function newDefaultWaitTargetDesk(store: DefaultWaitTargetStore, clockValue: clock.Clock): DefaultWaitTargetDesk {
  return new DefaultWaitTargetDesk(store, defaultDefaultWaitTargetValidator(), clockValue, []);
}
