import * as clock from "../../../../kit/clock.js";
import {
  ScheduledTouchpointSegmentEngine,
  defaultScheduledTouchpointSegmentEngine,
} from "./scheduled-touchpoint-segment-engine.js";
import {
  ScheduledTouchpointSegmentValidator,
  defaultScheduledTouchpointSegmentValidator,
} from "./scheduled-touchpoint-segment-rules.js";
import { ScheduledTouchpointSegmentStore } from "./scheduled-touchpoint-segment-store.js";

/** Moves scheduled touchpoint segments through their life cycle and keeps a journal of what it did. */
export class ScheduledTouchpointSegmentDesk {
  store: ScheduledTouchpointSegmentStore;
  validator: ScheduledTouchpointSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledTouchpointSegmentEngine;

  constructor(
    store: ScheduledTouchpointSegmentStore,
    validator: ScheduledTouchpointSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledTouchpointSegmentEngine,
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
      throw new Error(`scheduled touchpoint segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled touchpoint segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled touchpoint segment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newScheduledTouchpointSegmentDesk(store: ScheduledTouchpointSegmentStore, clockValue: clock.Clock): ScheduledTouchpointSegmentDesk {
  return new ScheduledTouchpointSegmentDesk(
    store,
    defaultScheduledTouchpointSegmentValidator(),
    clockValue,
    [],
    defaultScheduledTouchpointSegmentEngine(),
  );
}
