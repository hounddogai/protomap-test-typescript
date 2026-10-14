import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingFrequencyProposalEngine,
  defaultPendingFrequencyProposalEngine,
} from "./pending-frequency-proposal-engine.js";
import {
  PendingFrequencyProposalValidator,
  defaultPendingFrequencyProposalValidator,
} from "./pending-frequency-proposal-rules.js";
import { PendingFrequencyProposalStore } from "./pending-frequency-proposal-store.js";

/** Moves pending frequency proposals through their life cycle and keeps a journal of what it did. */
export class PendingFrequencyProposalDesk {
  store: PendingFrequencyProposalStore;
  validator: PendingFrequencyProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingFrequencyProposalEngine;

  constructor(
    store: PendingFrequencyProposalStore,
    validator: PendingFrequencyProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingFrequencyProposalEngine,
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
      throw new Error(`pending frequency proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending frequency proposal ${code} not found`);
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
      throw new Error(`pending frequency proposal ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingFrequencyProposalDesk(store: PendingFrequencyProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingFrequencyProposalDesk {
  return new PendingFrequencyProposalDesk(
    store,
    defaultPendingFrequencyProposalValidator(),
    clockValue,
    [],
    defaultPendingFrequencyProposalEngine(flagsValue),
  );
}
