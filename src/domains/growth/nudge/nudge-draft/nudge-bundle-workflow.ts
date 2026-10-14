import * as clock from "../../../../kit/clock.js";
import { NudgeBundleValidator, defaultNudgeBundleValidator } from "./nudge-bundle-rules.js";
import { NudgeBundleStore } from "./nudge-bundle-store.js";

/** Moves nudge bundles through their life cycle and keeps a journal of what it did. */
export class NudgeBundleDesk {
  store: NudgeBundleStore;
  validator: NudgeBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: NudgeBundleStore,
    validator: NudgeBundleValidator,
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
      throw new Error(`nudge bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newNudgeBundleDesk(store: NudgeBundleStore, clockValue: clock.Clock): NudgeBundleDesk {
  return new NudgeBundleDesk(store, defaultNudgeBundleValidator(), clockValue, []);
}
