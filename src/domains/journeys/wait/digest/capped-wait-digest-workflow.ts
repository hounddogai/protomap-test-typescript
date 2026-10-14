import * as clock from "../../../../kit/clock.js";
import { CappedWaitDigestValidator, defaultCappedWaitDigestValidator } from "./capped-wait-digest-rules.js";
import { CappedWaitDigestStore } from "./capped-wait-digest-store.js";

/** Moves capped wait digests through their life cycle and keeps a journal of what it did. */
export class CappedWaitDigestDesk {
  store: CappedWaitDigestStore;
  validator: CappedWaitDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedWaitDigestStore,
    validator: CappedWaitDigestValidator,
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
      throw new Error(`capped wait digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped wait digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newCappedWaitDigestDesk(store: CappedWaitDigestStore, clockValue: clock.Clock): CappedWaitDigestDesk {
  return new CappedWaitDigestDesk(store, defaultCappedWaitDigestValidator(), clockValue, []);
}
