import * as clock from "../../../../kit/clock.js";
import { BranchTierEngine, defaultBranchTierEngine } from "./branch-tier-engine.js";
import { BranchTierValidator, defaultBranchTierValidator } from "./branch-tier-rules.js";
import { BranchTierStore } from "./branch-tier-store.js";

/** Moves branch tiers through their life cycle and keeps a journal of what it did. */
export class BranchTierManager {
  store: BranchTierStore;
  validator: BranchTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchTierEngine;

  constructor(
    store: BranchTierStore,
    validator: BranchTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchTierEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch tier ${code} not found`);
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

export function newBranchTierManager(store: BranchTierStore, clockValue: clock.Clock): BranchTierManager {
  return new BranchTierManager(store, defaultBranchTierValidator(), clockValue, [], defaultBranchTierEngine());
}
