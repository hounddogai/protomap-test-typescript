import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalPostProposalEngine, defaultRegionalPostProposalEngine } from "./regional-post-proposal-engine.js";
import {
  RegionalPostProposalValidator,
  defaultRegionalPostProposalValidator,
} from "./regional-post-proposal-rules.js";
import { RegionalPostProposalStore } from "./regional-post-proposal-store.js";

/** Moves regional post proposals through their life cycle and keeps a journal of what it did. */
export class RegionalPostProposalCoordinator {
  store: RegionalPostProposalStore;
  validator: RegionalPostProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalPostProposalEngine;

  constructor(
    store: RegionalPostProposalStore,
    validator: RegionalPostProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalPostProposalEngine,
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
      throw new Error(`regional post proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional post proposal ${code} not found`);
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
      throw new Error(`regional post proposal ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalPostProposalCoordinator(store: RegionalPostProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalPostProposalCoordinator {
  return new RegionalPostProposalCoordinator(
    store,
    defaultRegionalPostProposalValidator(),
    clockValue,
    [],
    defaultRegionalPostProposalEngine(flagsValue),
  );
}
