import * as clock from "../../../../kit/clock.js";
import { BranchQuotaEngine, defaultBranchQuotaEngine } from "./branch-quota-engine.js";
import { BranchQuotaValidator, defaultBranchQuotaValidator } from "./branch-quota-rules.js";
import { BranchQuotaStore } from "./branch-quota-store.js";

/** Moves branch quotas through their life cycle and keeps a journal of what it did. */
export class BranchQuotaManager {
  store: BranchQuotaStore;
  validator: BranchQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchQuotaEngine;

  constructor(
    store: BranchQuotaStore,
    validator: BranchQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchQuotaEngine,
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
      throw new Error(`branch quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch quota ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBranchQuotaManager(store: BranchQuotaStore, clockValue: clock.Clock): BranchQuotaManager {
  return new BranchQuotaManager(store, defaultBranchQuotaValidator(), clockValue, [], defaultBranchQuotaEngine());
}
