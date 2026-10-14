import * as clock from "../../../../kit/clock.js";
import { AdaptiveFlightGroupEngine, defaultAdaptiveFlightGroupEngine } from "./adaptive-flight-group-engine.js";
import { AdaptiveFlightGroupValidator, defaultAdaptiveFlightGroupValidator } from "./adaptive-flight-group-rules.js";
import { AdaptiveFlightGroupStore } from "./adaptive-flight-group-store.js";

/** Moves adaptive flight groups through their life cycle and keeps a journal of what it did. */
export class AdaptiveFlightGroupWorkflow {
  store: AdaptiveFlightGroupStore;
  validator: AdaptiveFlightGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveFlightGroupEngine;

  constructor(
    store: AdaptiveFlightGroupStore,
    validator: AdaptiveFlightGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveFlightGroupEngine,
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
      throw new Error(`adaptive flight group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive flight group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive flight group ${code} not found`);
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

export function newAdaptiveFlightGroupWorkflow(store: AdaptiveFlightGroupStore, clockValue: clock.Clock): AdaptiveFlightGroupWorkflow {
  return new AdaptiveFlightGroupWorkflow(
    store,
    defaultAdaptiveFlightGroupValidator(),
    clockValue,
    [],
    defaultAdaptiveFlightGroupEngine(),
  );
}
