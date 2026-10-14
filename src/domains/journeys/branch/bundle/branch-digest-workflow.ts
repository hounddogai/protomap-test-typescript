import * as clock from "../../../../kit/clock.js";
import { BranchDigestEngine, defaultBranchDigestEngine } from "./branch-digest-engine.js";
import { BranchDigestValidator, defaultBranchDigestValidator } from "./branch-digest-rules.js";
import { BranchDigestStore } from "./branch-digest-store.js";

/** Moves branch digests through their life cycle and keeps a journal of what it did. */
export class BranchDigestManager {
  store: BranchDigestStore;
  validator: BranchDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchDigestEngine;

  constructor(
    store: BranchDigestStore,
    validator: BranchDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchDigestEngine,
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
      throw new Error(`branch digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch digest ${code} not found`);
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
      throw new Error(`branch digest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newBranchDigestManager(store: BranchDigestStore, clockValue: clock.Clock): BranchDigestManager {
  return new BranchDigestManager(store, defaultBranchDigestValidator(), clockValue, [], defaultBranchDigestEngine());
}
