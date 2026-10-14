import * as clock from "../../../../kit/clock.js";
import { ComplaintWindowValidator, defaultComplaintWindowValidator } from "./complaint-window-rules.js";
import { ComplaintWindowStore } from "./complaint-window-store.js";

/** Moves complaint windows through their life cycle and keeps a journal of what it did. */
export class ComplaintWindowService {
  store: ComplaintWindowStore;
  validator: ComplaintWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ComplaintWindowStore,
    validator: ComplaintWindowValidator,
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
      throw new Error(`complaint window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newComplaintWindowService(store: ComplaintWindowStore, clockValue: clock.Clock): ComplaintWindowService {
  return new ComplaintWindowService(store, defaultComplaintWindowValidator(), clockValue, []);
}
