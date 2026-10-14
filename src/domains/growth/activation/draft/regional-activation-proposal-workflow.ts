import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalActivationProposalEngine,
  defaultRegionalActivationProposalEngine,
} from "./regional-activation-proposal-engine.js";
import {
  RegionalActivationProposalValidator,
  defaultRegionalActivationProposalValidator,
} from "./regional-activation-proposal-rules.js";
import { RegionalActivationProposalStore } from "./regional-activation-proposal-store.js";

/** Moves regional activation proposals through their life cycle and keeps a journal of what it did. */
export class RegionalActivationProposalDesk {
  store: RegionalActivationProposalStore;
  validator: RegionalActivationProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalActivationProposalEngine;

  constructor(
    store: RegionalActivationProposalStore,
    validator: RegionalActivationProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalActivationProposalEngine,
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
      throw new Error(`regional activation proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional activation proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional activation proposal ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRegionalActivationProposalDesk(store: RegionalActivationProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalActivationProposalDesk {
  return new RegionalActivationProposalDesk(
    store,
    defaultRegionalActivationProposalValidator(),
    clockValue,
    [],
    defaultRegionalActivationProposalEngine(flagsValue),
  );
}
