import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DoubleOptInProposalEngine, defaultDoubleOptInProposalEngine } from "./double-opt-in-proposal-engine.js";
import { DoubleOptInProposalValidator, defaultDoubleOptInProposalValidator } from "./double-opt-in-proposal-rules.js";
import { DoubleOptInProposalStore } from "./double-opt-in-proposal-store.js";

/** Moves double opt in proposals through their life cycle and keeps a journal of what it did. */
export class DoubleOptInProposalManager {
  store: DoubleOptInProposalStore;
  validator: DoubleOptInProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInProposalEngine;

  constructor(
    store: DoubleOptInProposalStore,
    validator: DoubleOptInProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInProposalEngine,
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
      throw new Error(`double opt in proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDoubleOptInProposalManager(store: DoubleOptInProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): DoubleOptInProposalManager {
  return new DoubleOptInProposalManager(
    store,
    defaultDoubleOptInProposalValidator(),
    clockValue,
    [],
    defaultDoubleOptInProposalEngine(flagsValue),
  );
}
