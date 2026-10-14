import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ScheduledFlightScoreEngine, defaultScheduledFlightScoreEngine } from "./scheduled-flight-score-engine.js";
import {
  ScheduledFlightScoreValidator,
  defaultScheduledFlightScoreValidator,
} from "./scheduled-flight-score-rules.js";
import { ScheduledFlightScoreStore } from "./scheduled-flight-score-store.js";

/** Moves scheduled flight scores through their life cycle and keeps a journal of what it did. */
export class ScheduledFlightScoreCoordinator {
  store: ScheduledFlightScoreStore;
  validator: ScheduledFlightScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFlightScoreEngine;

  constructor(
    store: ScheduledFlightScoreStore,
    validator: ScheduledFlightScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFlightScoreEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight score ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newScheduledFlightScoreCoordinator(store: ScheduledFlightScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledFlightScoreCoordinator {
  return new ScheduledFlightScoreCoordinator(
    store,
    defaultScheduledFlightScoreValidator(),
    clockValue,
    [],
    defaultScheduledFlightScoreEngine(flagsValue),
  );
}
