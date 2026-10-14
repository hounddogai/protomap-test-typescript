import * as clock from "../../../../kit/clock.js";
import {
  PendingCreativeBundleValidator,
  defaultPendingCreativeBundleValidator,
} from "./pending-creative-bundle-rules.js";
import { PendingCreativeBundleStore } from "./pending-creative-bundle-store.js";

/** Moves pending creative bundles through their life cycle and keeps a journal of what it did. */
export class PendingCreativeBundleManager {
  store: PendingCreativeBundleStore;
  validator: PendingCreativeBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingCreativeBundleStore,
    validator: PendingCreativeBundleValidator,
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
      throw new Error(`pending creative bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending creative bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newPendingCreativeBundleManager(store: PendingCreativeBundleStore, clockValue: clock.Clock): PendingCreativeBundleManager {
  return new PendingCreativeBundleManager(store, defaultPendingCreativeBundleValidator(), clockValue, []);
}
