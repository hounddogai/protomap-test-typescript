import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientPacingSegmentEngine, defaultLenientPacingSegmentEngine } from "./lenient-pacing-segment-engine.js";
import {
  LenientPacingSegmentValidator,
  defaultLenientPacingSegmentValidator,
} from "./lenient-pacing-segment-rules.js";
import { LenientPacingSegmentStore } from "./lenient-pacing-segment-store.js";

/** Moves lenient pacing segments through their life cycle and keeps a journal of what it did. */
export class LenientPacingSegmentManager {
  store: LenientPacingSegmentStore;
  validator: LenientPacingSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPacingSegmentEngine;

  constructor(
    store: LenientPacingSegmentStore,
    validator: LenientPacingSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPacingSegmentEngine,
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
      throw new Error(`lenient pacing segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient pacing segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient pacing segment ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLenientPacingSegmentManager(store: LenientPacingSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientPacingSegmentManager {
  return new LenientPacingSegmentManager(
    store,
    defaultLenientPacingSegmentValidator(),
    clockValue,
    [],
    defaultLenientPacingSegmentEngine(flagsValue),
  );
}
