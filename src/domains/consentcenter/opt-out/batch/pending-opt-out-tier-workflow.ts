import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingOptOutTierEngine, defaultPendingOptOutTierEngine } from "./pending-opt-out-tier-engine.js";
import { PendingOptOutTierValidator, defaultPendingOptOutTierValidator } from "./pending-opt-out-tier-rules.js";
import { PendingOptOutTierStore } from "./pending-opt-out-tier-store.js";

/** Moves pending opt out tiers through their life cycle and keeps a journal of what it did. */
export class PendingOptOutTierService {
  store: PendingOptOutTierStore;
  validator: PendingOptOutTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingOptOutTierEngine;

  constructor(
    store: PendingOptOutTierStore,
    validator: PendingOptOutTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingOptOutTierEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending opt out tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending opt out tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending opt out tier ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPendingOptOutTierService(store: PendingOptOutTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingOptOutTierService {
  return new PendingOptOutTierService(
    store,
    defaultPendingOptOutTierValidator(),
    clockValue,
    [],
    defaultPendingOptOutTierEngine(flagsValue),
  );
}
