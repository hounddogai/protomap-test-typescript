import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveSenderProposalEngine,
  defaultAdaptiveSenderProposalEngine,
} from "./adaptive-sender-proposal-engine.js";
import {
  AdaptiveSenderProposalValidator,
  defaultAdaptiveSenderProposalValidator,
} from "./adaptive-sender-proposal-rules.js";
import { AdaptiveSenderProposalStore } from "./adaptive-sender-proposal-store.js";

/** Moves adaptive sender proposals through their life cycle and keeps a journal of what it did. */
export class AdaptiveSenderProposalWorkflow {
  store: AdaptiveSenderProposalStore;
  validator: AdaptiveSenderProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveSenderProposalEngine;

  constructor(
    store: AdaptiveSenderProposalStore,
    validator: AdaptiveSenderProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveSenderProposalEngine,
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
      throw new Error(`adaptive sender proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive sender proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive sender proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newAdaptiveSenderProposalWorkflow(store: AdaptiveSenderProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveSenderProposalWorkflow {
  return new AdaptiveSenderProposalWorkflow(
    store,
    defaultAdaptiveSenderProposalValidator(),
    clockValue,
    [],
    defaultAdaptiveSenderProposalEngine(flagsValue),
  );
}
