import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceProposalEngine, defaultPreferenceProposalEngine } from "./preference-proposal-engine.js";
import { PreferenceProposalValidator, defaultPreferenceProposalValidator } from "./preference-proposal-rules.js";
import { PreferenceProposalStore } from "./preference-proposal-store.js";

/** Moves preference proposals through their life cycle and keeps a journal of what it did. */
export class PreferenceProposalDesk {
  store: PreferenceProposalStore;
  validator: PreferenceProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceProposalEngine;

  constructor(
    store: PreferenceProposalStore,
    validator: PreferenceProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceProposalEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference proposal ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPreferenceProposalDesk(store: PreferenceProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceProposalDesk {
  return new PreferenceProposalDesk(
    store,
    defaultPreferenceProposalValidator(),
    clockValue,
    [],
    defaultPreferenceProposalEngine(flagsValue),
  );
}
