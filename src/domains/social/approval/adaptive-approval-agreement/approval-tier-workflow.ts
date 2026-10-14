import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ApprovalTierEngine, defaultApprovalTierEngine } from "./approval-tier-engine.js";
import { ApprovalTierValidator, defaultApprovalTierValidator } from "./approval-tier-rules.js";
import { ApprovalTierStore } from "./approval-tier-store.js";

/** Moves approval tiers through their life cycle and keeps a journal of what it did. */
export class ApprovalTierCoordinator {
  store: ApprovalTierStore;
  validator: ApprovalTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalTierEngine;

  constructor(
    store: ApprovalTierStore,
    validator: ApprovalTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalTierEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval tier ${code} not found`);
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
      throw new Error(`approval tier ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newApprovalTierCoordinator(store: ApprovalTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): ApprovalTierCoordinator {
  return new ApprovalTierCoordinator(
    store,
    defaultApprovalTierValidator(),
    clockValue,
    [],
    defaultApprovalTierEngine(flagsValue),
  );
}
