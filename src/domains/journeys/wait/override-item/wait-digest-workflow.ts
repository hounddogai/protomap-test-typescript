import * as clock from "../../../../kit/clock.js";
import { WaitDigestValidator, defaultWaitDigestValidator } from "./wait-digest-rules.js";
import { WaitDigestStore } from "./wait-digest-store.js";

/** Moves wait digests through their life cycle and keeps a journal of what it did. */
export class WaitDigestWorkflow {
  store: WaitDigestStore;
  validator: WaitDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: WaitDigestStore, validator: WaitDigestValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`wait digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newWaitDigestWorkflow(store: WaitDigestStore, clockValue: clock.Clock): WaitDigestWorkflow {
  return new WaitDigestWorkflow(store, defaultWaitDigestValidator(), clockValue, []);
}
