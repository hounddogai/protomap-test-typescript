import * as clock from "../../../../kit/clock.js";
import { QueueBundleValidator, defaultQueueBundleValidator } from "./queue-bundle-rules.js";
import { QueueBundleStore } from "./queue-bundle-store.js";

/** Moves queue bundles through their life cycle and keeps a journal of what it did. */
export class QueueBundleDesk {
  store: QueueBundleStore;
  validator: QueueBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: QueueBundleStore,
    validator: QueueBundleValidator,
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
      throw new Error(`queue bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue bundle ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newQueueBundleDesk(store: QueueBundleStore, clockValue: clock.Clock): QueueBundleDesk {
  return new QueueBundleDesk(store, defaultQueueBundleValidator(), clockValue, []);
}
