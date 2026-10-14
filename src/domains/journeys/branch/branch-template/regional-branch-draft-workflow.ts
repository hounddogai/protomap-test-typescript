import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalBranchDraftEngine, defaultRegionalBranchDraftEngine } from "./regional-branch-draft-engine.js";
import { RegionalBranchDraftValidator, defaultRegionalBranchDraftValidator } from "./regional-branch-draft-rules.js";
import { RegionalBranchDraftStore } from "./regional-branch-draft-store.js";

/** Moves regional branch drafts through their life cycle and keeps a journal of what it did. */
export class RegionalBranchDraftCoordinator {
  store: RegionalBranchDraftStore;
  validator: RegionalBranchDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalBranchDraftEngine;

  constructor(
    store: RegionalBranchDraftStore,
    validator: RegionalBranchDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalBranchDraftEngine,
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
      throw new Error(`regional branch draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional branch draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional branch draft ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalBranchDraftCoordinator(store: RegionalBranchDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalBranchDraftCoordinator {
  return new RegionalBranchDraftCoordinator(
    store,
    defaultRegionalBranchDraftValidator(),
    clockValue,
    [],
    defaultRegionalBranchDraftEngine(flagsValue),
  );
}
