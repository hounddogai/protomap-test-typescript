import * as clock from "../../../../kit/clock.js";
import {
  LegacyPreferencePolicyValidator,
  defaultLegacyPreferencePolicyValidator,
} from "./legacy-preference-policy-rules.js";
import { LegacyPreferencePolicyStore } from "./legacy-preference-policy-store.js";

/** Moves legacy preference policies through their life cycle and keeps a journal of what it did. */
export class LegacyPreferencePolicyCoordinator {
  store: LegacyPreferencePolicyStore;
  validator: LegacyPreferencePolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyPreferencePolicyStore,
    validator: LegacyPreferencePolicyValidator,
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
      throw new Error(`legacy preference policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy preference policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newLegacyPreferencePolicyCoordinator(store: LegacyPreferencePolicyStore, clockValue: clock.Clock): LegacyPreferencePolicyCoordinator {
  return new LegacyPreferencePolicyCoordinator(store, defaultLegacyPreferencePolicyValidator(), clockValue, []);
}
