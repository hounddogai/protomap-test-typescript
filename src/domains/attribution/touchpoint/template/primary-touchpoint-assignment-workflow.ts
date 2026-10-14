import * as clock from "../../../../kit/clock.js";
import {
  PrimaryTouchpointAssignmentEngine,
  defaultPrimaryTouchpointAssignmentEngine,
} from "./primary-touchpoint-assignment-engine.js";
import {
  PrimaryTouchpointAssignmentValidator,
  defaultPrimaryTouchpointAssignmentValidator,
} from "./primary-touchpoint-assignment-rules.js";
import { PrimaryTouchpointAssignmentStore } from "./primary-touchpoint-assignment-store.js";

/** Moves primary touchpoint assignments through their life cycle and keeps a journal of what it did. */
export class PrimaryTouchpointAssignmentCoordinator {
  store: PrimaryTouchpointAssignmentStore;
  validator: PrimaryTouchpointAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryTouchpointAssignmentEngine;

  constructor(
    store: PrimaryTouchpointAssignmentStore,
    validator: PrimaryTouchpointAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryTouchpointAssignmentEngine,
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
      throw new Error(`primary touchpoint assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary touchpoint assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary touchpoint assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPrimaryTouchpointAssignmentCoordinator(store: PrimaryTouchpointAssignmentStore, clockValue: clock.Clock): PrimaryTouchpointAssignmentCoordinator {
  return new PrimaryTouchpointAssignmentCoordinator(
    store,
    defaultPrimaryTouchpointAssignmentValidator(),
    clockValue,
    [],
    defaultPrimaryTouchpointAssignmentEngine(),
  );
}
