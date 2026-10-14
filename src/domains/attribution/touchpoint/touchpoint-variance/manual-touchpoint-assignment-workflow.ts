import * as clock from "../../../../kit/clock.js";
import {
  ManualTouchpointAssignmentEngine,
  defaultManualTouchpointAssignmentEngine,
} from "./manual-touchpoint-assignment-engine.js";
import {
  ManualTouchpointAssignmentValidator,
  defaultManualTouchpointAssignmentValidator,
} from "./manual-touchpoint-assignment-rules.js";
import { ManualTouchpointAssignmentStore } from "./manual-touchpoint-assignment-store.js";

/** Moves manual touchpoint assignments through their life cycle and keeps a journal of what it did. */
export class ManualTouchpointAssignmentManager {
  store: ManualTouchpointAssignmentStore;
  validator: ManualTouchpointAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualTouchpointAssignmentEngine;

  constructor(
    store: ManualTouchpointAssignmentStore,
    validator: ManualTouchpointAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualTouchpointAssignmentEngine,
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
      throw new Error(`manual touchpoint assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual touchpoint assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual touchpoint assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newManualTouchpointAssignmentManager(store: ManualTouchpointAssignmentStore, clockValue: clock.Clock): ManualTouchpointAssignmentManager {
  return new ManualTouchpointAssignmentManager(
    store,
    defaultManualTouchpointAssignmentValidator(),
    clockValue,
    [],
    defaultManualTouchpointAssignmentEngine(),
  );
}
