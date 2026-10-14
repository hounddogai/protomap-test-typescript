import * as clock from "../../../../kit/clock.js";
import { WindowDigestValidator, defaultWindowDigestValidator } from "./window-digest-rules.js";
import { WindowDigestStore } from "./window-digest-store.js";

/** Moves window digests through their life cycle and keeps a journal of what it did. */
export class WindowDigestService {
  store: WindowDigestStore;
  validator: WindowDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WindowDigestStore,
    validator: WindowDigestValidator,
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
      throw new Error(`window digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window digest ${code} not found`);
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

export function newWindowDigestService(store: WindowDigestStore, clockValue: clock.Clock): WindowDigestService {
  return new WindowDigestService(store, defaultWindowDigestValidator(), clockValue, []);
}
