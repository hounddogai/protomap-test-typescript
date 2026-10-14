import * as clock from "../../../../kit/clock.js";
import { JourneyThresholdEngine, defaultJourneyThresholdEngine } from "./journey-threshold-engine.js";
import { JourneyThresholdValidator, defaultJourneyThresholdValidator } from "./journey-threshold-rules.js";
import { JourneyThresholdStore } from "./journey-threshold-store.js";

/** Moves journey thresholds through their life cycle and keeps a journal of what it did. */
export class JourneyThresholdCoordinator {
  store: JourneyThresholdStore;
  validator: JourneyThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyThresholdEngine;

  constructor(
    store: JourneyThresholdStore,
    validator: JourneyThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyThresholdEngine,
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
      throw new Error(`journey threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey threshold ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newJourneyThresholdCoordinator(store: JourneyThresholdStore, clockValue: clock.Clock): JourneyThresholdCoordinator {
  return new JourneyThresholdCoordinator(
    store,
    defaultJourneyThresholdValidator(),
    clockValue,
    [],
    defaultJourneyThresholdEngine(),
  );
}
