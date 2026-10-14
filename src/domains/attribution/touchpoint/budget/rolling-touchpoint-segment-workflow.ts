import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingTouchpointSegmentEngine,
  defaultRollingTouchpointSegmentEngine,
} from "./rolling-touchpoint-segment-engine.js";
import {
  RollingTouchpointSegmentValidator,
  defaultRollingTouchpointSegmentValidator,
} from "./rolling-touchpoint-segment-rules.js";
import { RollingTouchpointSegmentStore } from "./rolling-touchpoint-segment-store.js";

/** Moves rolling touchpoint segments through their life cycle and keeps a journal of what it did. */
export class RollingTouchpointSegmentManager {
  store: RollingTouchpointSegmentStore;
  validator: RollingTouchpointSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingTouchpointSegmentEngine;

  constructor(
    store: RollingTouchpointSegmentStore,
    validator: RollingTouchpointSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingTouchpointSegmentEngine,
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
      throw new Error(`rolling touchpoint segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling touchpoint segment ${code} not found`);
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
      throw new Error(`rolling touchpoint segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingTouchpointSegmentManager(store: RollingTouchpointSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingTouchpointSegmentManager {
  return new RollingTouchpointSegmentManager(
    store,
    defaultRollingTouchpointSegmentValidator(),
    clockValue,
    [],
    defaultRollingTouchpointSegmentEngine(flagsValue),
  );
}
