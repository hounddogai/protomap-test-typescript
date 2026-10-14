import * as clock from "../../../../kit/clock.js";
import { FlightMilestoneEngine, defaultFlightMilestoneEngine } from "./flight-milestone-engine.js";
import { FlightMilestoneValidator, defaultFlightMilestoneValidator } from "./flight-milestone-rules.js";
import { FlightMilestoneStore } from "./flight-milestone-store.js";

/** Moves flight milestones through their life cycle and keeps a journal of what it did. */
export class FlightMilestoneService {
  store: FlightMilestoneStore;
  validator: FlightMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FlightMilestoneEngine;

  constructor(
    store: FlightMilestoneStore,
    validator: FlightMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FlightMilestoneEngine,
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
      throw new Error(`flight milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight milestone ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFlightMilestoneService(store: FlightMilestoneStore, clockValue: clock.Clock): FlightMilestoneService {
  return new FlightMilestoneService(
    store,
    defaultFlightMilestoneValidator(),
    clockValue,
    [],
    defaultFlightMilestoneEngine(),
  );
}
