import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalPlacementEntryEngine,
  defaultRegionalPlacementEntryEngine,
} from "./regional-placement-entry-engine.js";
import {
  RegionalPlacementEntryValidator,
  defaultRegionalPlacementEntryValidator,
} from "./regional-placement-entry-rules.js";
import { RegionalPlacementEntryStore } from "./regional-placement-entry-store.js";

/** Moves regional placement entries through their life cycle and keeps a journal of what it did. */
export class RegionalPlacementEntryManager {
  store: RegionalPlacementEntryStore;
  validator: RegionalPlacementEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalPlacementEntryEngine;

  constructor(
    store: RegionalPlacementEntryStore,
    validator: RegionalPlacementEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalPlacementEntryEngine,
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
      throw new Error(`regional placement entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional placement entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional placement entry ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRegionalPlacementEntryManager(store: RegionalPlacementEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalPlacementEntryManager {
  return new RegionalPlacementEntryManager(
    store,
    defaultRegionalPlacementEntryValidator(),
    clockValue,
    [],
    defaultRegionalPlacementEntryEngine(flagsValue),
  );
}
