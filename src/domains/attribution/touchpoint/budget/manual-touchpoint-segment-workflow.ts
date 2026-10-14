import * as clock from "../../../../kit/clock.js";
import {
  ManualTouchpointSegmentEngine,
  defaultManualTouchpointSegmentEngine,
} from "./manual-touchpoint-segment-engine.js";
import {
  ManualTouchpointSegmentValidator,
  defaultManualTouchpointSegmentValidator,
} from "./manual-touchpoint-segment-rules.js";
import { ManualTouchpointSegmentStore } from "./manual-touchpoint-segment-store.js";

/** Moves manual touchpoint segments through their life cycle and keeps a journal of what it did. */
export class ManualTouchpointSegmentCoordinator {
  store: ManualTouchpointSegmentStore;
  validator: ManualTouchpointSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualTouchpointSegmentEngine;

  constructor(
    store: ManualTouchpointSegmentStore,
    validator: ManualTouchpointSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualTouchpointSegmentEngine,
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
      throw new Error(`manual touchpoint segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual touchpoint segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual touchpoint segment ${code} not found`);
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

export function newManualTouchpointSegmentCoordinator(store: ManualTouchpointSegmentStore, clockValue: clock.Clock): ManualTouchpointSegmentCoordinator {
  return new ManualTouchpointSegmentCoordinator(
    store,
    defaultManualTouchpointSegmentValidator(),
    clockValue,
    [],
    defaultManualTouchpointSegmentEngine(),
  );
}
