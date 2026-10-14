import * as clock from "../../../../kit/clock.js";
import { ManualTierWindowValidator, defaultManualTierWindowValidator } from "./manual-tier-window-rules.js";
import { ManualTierWindowStore } from "./manual-tier-window-store.js";

/** Moves manual tier windows through their life cycle and keeps a journal of what it did. */
export class ManualTierWindowService {
  store: ManualTierWindowStore;
  validator: ManualTierWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualTierWindowStore,
    validator: ManualTierWindowValidator,
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
      throw new Error(`manual tier window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual tier window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newManualTierWindowService(store: ManualTierWindowStore, clockValue: clock.Clock): ManualTierWindowService {
  return new ManualTierWindowService(store, defaultManualTierWindowValidator(), clockValue, []);
}
