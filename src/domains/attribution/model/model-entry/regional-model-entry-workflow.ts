import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalModelEntryEngine, defaultRegionalModelEntryEngine } from "./regional-model-entry-engine.js";
import { RegionalModelEntryValidator, defaultRegionalModelEntryValidator } from "./regional-model-entry-rules.js";
import { RegionalModelEntryStore } from "./regional-model-entry-store.js";

/** Moves regional model entries through their life cycle and keeps a journal of what it did. */
export class RegionalModelEntryCoordinator {
  store: RegionalModelEntryStore;
  validator: RegionalModelEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalModelEntryEngine;

  constructor(
    store: RegionalModelEntryStore,
    validator: RegionalModelEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalModelEntryEngine,
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
      throw new Error(`regional model entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional model entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional model entry ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRegionalModelEntryCoordinator(store: RegionalModelEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalModelEntryCoordinator {
  return new RegionalModelEntryCoordinator(
    store,
    defaultRegionalModelEntryValidator(),
    clockValue,
    [],
    defaultRegionalModelEntryEngine(flagsValue),
  );
}
