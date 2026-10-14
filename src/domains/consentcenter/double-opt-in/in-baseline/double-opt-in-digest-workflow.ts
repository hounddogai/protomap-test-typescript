import * as clock from "../../../../kit/clock.js";
import { DoubleOptInDigestValidator, defaultDoubleOptInDigestValidator } from "./double-opt-in-digest-rules.js";
import { DoubleOptInDigestStore } from "./double-opt-in-digest-store.js";

/** Moves double opt in digests through their life cycle and keeps a journal of what it did. */
export class DoubleOptInDigestWorkflow {
  store: DoubleOptInDigestStore;
  validator: DoubleOptInDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DoubleOptInDigestStore,
    validator: DoubleOptInDigestValidator,
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
      throw new Error(`double opt in digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newDoubleOptInDigestWorkflow(store: DoubleOptInDigestStore, clockValue: clock.Clock): DoubleOptInDigestWorkflow {
  return new DoubleOptInDigestWorkflow(store, defaultDoubleOptInDigestValidator(), clockValue, []);
}
