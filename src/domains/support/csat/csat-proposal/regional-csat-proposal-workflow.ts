import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalCsatProposalEngine, defaultRegionalCsatProposalEngine } from "./regional-csat-proposal-engine.js";
import {
  RegionalCsatProposalValidator,
  defaultRegionalCsatProposalValidator,
} from "./regional-csat-proposal-rules.js";
import { RegionalCsatProposalStore } from "./regional-csat-proposal-store.js";

/** Moves regional csat proposals through their life cycle and keeps a journal of what it did. */
export class RegionalCsatProposalManager {
  store: RegionalCsatProposalStore;
  validator: RegionalCsatProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalCsatProposalEngine;

  constructor(
    store: RegionalCsatProposalStore,
    validator: RegionalCsatProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalCsatProposalEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional csat proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional csat proposal ${code} not found`);
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
      throw new Error(`regional csat proposal ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRegionalCsatProposalManager(store: RegionalCsatProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalCsatProposalManager {
  return new RegionalCsatProposalManager(
    store,
    defaultRegionalCsatProposalValidator(),
    clockValue,
    [],
    defaultRegionalCsatProposalEngine(flagsValue),
  );
}
