import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictMacroProposalEngine, defaultStrictMacroProposalEngine } from "./strict-macro-proposal-engine.js";
import { StrictMacroProposalValidator, defaultStrictMacroProposalValidator } from "./strict-macro-proposal-rules.js";
import { StrictMacroProposalStore } from "./strict-macro-proposal-store.js";

/** Moves strict macro proposals through their life cycle and keeps a journal of what it did. */
export class StrictMacroProposalManager {
  store: StrictMacroProposalStore;
  validator: StrictMacroProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictMacroProposalEngine;

  constructor(
    store: StrictMacroProposalStore,
    validator: StrictMacroProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictMacroProposalEngine,
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
      throw new Error(`strict macro proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict macro proposal ${code} not found`);
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
      throw new Error(`strict macro proposal ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newStrictMacroProposalManager(store: StrictMacroProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictMacroProposalManager {
  return new StrictMacroProposalManager(
    store,
    defaultStrictMacroProposalValidator(),
    clockValue,
    [],
    defaultStrictMacroProposalEngine(flagsValue),
  );
}
