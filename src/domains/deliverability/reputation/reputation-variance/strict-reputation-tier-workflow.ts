import * as clock from "../../../../kit/clock.js";
import { StrictReputationTierEngine, defaultStrictReputationTierEngine } from "./strict-reputation-tier-engine.js";
import {
  StrictReputationTierValidator,
  defaultStrictReputationTierValidator,
} from "./strict-reputation-tier-rules.js";
import { StrictReputationTierStore } from "./strict-reputation-tier-store.js";

/** Moves strict reputation tiers through their life cycle and keeps a journal of what it did. */
export class StrictReputationTierDesk {
  store: StrictReputationTierStore;
  validator: StrictReputationTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictReputationTierEngine;

  constructor(
    store: StrictReputationTierStore,
    validator: StrictReputationTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictReputationTierEngine,
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
      throw new Error(`strict reputation tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation tier ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newStrictReputationTierDesk(store: StrictReputationTierStore, clockValue: clock.Clock): StrictReputationTierDesk {
  return new StrictReputationTierDesk(
    store,
    defaultStrictReputationTierValidator(),
    clockValue,
    [],
    defaultStrictReputationTierEngine(),
  );
}
