import * as clock from "../../../../kit/clock.js";
import {
  RegionalMacroVarianceValidator,
  defaultRegionalMacroVarianceValidator,
} from "./regional-macro-variance-rules.js";
import { RegionalMacroVarianceStore } from "./regional-macro-variance-store.js";

/** Moves regional macro variances through their life cycle and keeps a journal of what it did. */
export class RegionalMacroVarianceDesk {
  store: RegionalMacroVarianceStore;
  validator: RegionalMacroVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalMacroVarianceStore,
    validator: RegionalMacroVarianceValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional macro variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional macro variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalMacroVarianceDesk(store: RegionalMacroVarianceStore, clockValue: clock.Clock): RegionalMacroVarianceDesk {
  return new RegionalMacroVarianceDesk(store, defaultRegionalMacroVarianceValidator(), clockValue, []);
}
