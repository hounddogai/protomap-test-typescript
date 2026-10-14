import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReputationTierEngine, defaultReputationTierEngine } from "./reputation-tier-engine.js";
import { ReputationTierValidator, defaultReputationTierValidator } from "./reputation-tier-rules.js";
import { ReputationTierStore } from "./reputation-tier-store.js";

/** Moves reputation tiers through their life cycle and keeps a journal of what it did. */
export class ReputationTierWorkflow {
  store: ReputationTierStore;
  validator: ReputationTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationTierEngine;

  constructor(
    store: ReputationTierStore,
    validator: ReputationTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationTierEngine,
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
      throw new Error(`reputation tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newReputationTierWorkflow(store: ReputationTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReputationTierWorkflow {
  return new ReputationTierWorkflow(
    store,
    defaultReputationTierValidator(),
    clockValue,
    [],
    defaultReputationTierEngine(flagsValue),
  );
}
