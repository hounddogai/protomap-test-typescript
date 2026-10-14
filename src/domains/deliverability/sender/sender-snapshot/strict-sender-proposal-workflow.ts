import * as clock from "../../../../kit/clock.js";
import { StrictSenderProposalEngine, defaultStrictSenderProposalEngine } from "./strict-sender-proposal-engine.js";
import {
  StrictSenderProposalValidator,
  defaultStrictSenderProposalValidator,
} from "./strict-sender-proposal-rules.js";
import { StrictSenderProposalStore } from "./strict-sender-proposal-store.js";

/** Moves strict sender proposals through their life cycle and keeps a journal of what it did. */
export class StrictSenderProposalDesk {
  store: StrictSenderProposalStore;
  validator: StrictSenderProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictSenderProposalEngine;

  constructor(
    store: StrictSenderProposalStore,
    validator: StrictSenderProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictSenderProposalEngine,
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
      throw new Error(`strict sender proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict sender proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict sender proposal ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newStrictSenderProposalDesk(store: StrictSenderProposalStore, clockValue: clock.Clock): StrictSenderProposalDesk {
  return new StrictSenderProposalDesk(
    store,
    defaultStrictSenderProposalValidator(),
    clockValue,
    [],
    defaultStrictSenderProposalEngine(),
  );
}
