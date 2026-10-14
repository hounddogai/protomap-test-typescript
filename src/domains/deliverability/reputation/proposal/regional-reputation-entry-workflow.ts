import * as clock from "../../../../kit/clock.js";
import {
  RegionalReputationEntryEngine,
  defaultRegionalReputationEntryEngine,
} from "./regional-reputation-entry-engine.js";
import {
  RegionalReputationEntryValidator,
  defaultRegionalReputationEntryValidator,
} from "./regional-reputation-entry-rules.js";
import { RegionalReputationEntryStore } from "./regional-reputation-entry-store.js";

/** Moves regional reputation entries through their life cycle and keeps a journal of what it did. */
export class RegionalReputationEntryWorkflow {
  store: RegionalReputationEntryStore;
  validator: RegionalReputationEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalReputationEntryEngine;

  constructor(
    store: RegionalReputationEntryStore,
    validator: RegionalReputationEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalReputationEntryEngine,
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
      throw new Error(`regional reputation entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reputation entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reputation entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRegionalReputationEntryWorkflow(store: RegionalReputationEntryStore, clockValue: clock.Clock): RegionalReputationEntryWorkflow {
  return new RegionalReputationEntryWorkflow(
    store,
    defaultRegionalReputationEntryValidator(),
    clockValue,
    [],
    defaultRegionalReputationEntryEngine(),
  );
}
