import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingOptOutProposalEngine,
  defaultRollingOptOutProposalEngine,
} from "./rolling-opt-out-proposal-engine.js";
import {
  RollingOptOutProposalValidator,
  defaultRollingOptOutProposalValidator,
} from "./rolling-opt-out-proposal-rules.js";
import { RollingOptOutProposalStore } from "./rolling-opt-out-proposal-store.js";

/** Moves rolling opt out proposals through their life cycle and keeps a journal of what it did. */
export class RollingOptOutProposalWorkflow {
  store: RollingOptOutProposalStore;
  validator: RollingOptOutProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingOptOutProposalEngine;

  constructor(
    store: RollingOptOutProposalStore,
    validator: RollingOptOutProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingOptOutProposalEngine,
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
      throw new Error(`rolling opt out proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling opt out proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling opt out proposal ${code} not found`);
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

export function newRollingOptOutProposalWorkflow(store: RollingOptOutProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingOptOutProposalWorkflow {
  return new RollingOptOutProposalWorkflow(
    store,
    defaultRollingOptOutProposalValidator(),
    clockValue,
    [],
    defaultRollingOptOutProposalEngine(flagsValue),
  );
}
