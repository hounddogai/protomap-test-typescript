import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalFlightCycleEngine, defaultGlobalFlightCycleEngine } from "./global-flight-cycle-engine.js";
import { GlobalFlightCycleValidator, defaultGlobalFlightCycleValidator } from "./global-flight-cycle-rules.js";
import { GlobalFlightCycleStore } from "./global-flight-cycle-store.js";

/** Moves global flight cycles through their life cycle and keeps a journal of what it did. */
export class GlobalFlightCycleService {
  store: GlobalFlightCycleStore;
  validator: GlobalFlightCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalFlightCycleEngine;

  constructor(
    store: GlobalFlightCycleStore,
    validator: GlobalFlightCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalFlightCycleEngine,
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
      throw new Error(`global flight cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global flight cycle ${code} not found`);
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
      throw new Error(`global flight cycle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newGlobalFlightCycleService(store: GlobalFlightCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalFlightCycleService {
  return new GlobalFlightCycleService(
    store,
    defaultGlobalFlightCycleValidator(),
    clockValue,
    [],
    defaultGlobalFlightCycleEngine(flagsValue),
  );
}
