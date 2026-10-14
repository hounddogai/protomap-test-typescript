import * as clock from "../../../../kit/clock.js";
import { LegacyOptOutSegmentEngine, defaultLegacyOptOutSegmentEngine } from "./legacy-opt-out-segment-engine.js";
import { LegacyOptOutSegmentValidator, defaultLegacyOptOutSegmentValidator } from "./legacy-opt-out-segment-rules.js";
import { LegacyOptOutSegmentStore } from "./legacy-opt-out-segment-store.js";

/** Moves legacy opt out segments through their life cycle and keeps a journal of what it did. */
export class LegacyOptOutSegmentManager {
  store: LegacyOptOutSegmentStore;
  validator: LegacyOptOutSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyOptOutSegmentEngine;

  constructor(
    store: LegacyOptOutSegmentStore,
    validator: LegacyOptOutSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyOptOutSegmentEngine,
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
      throw new Error(`legacy opt out segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy opt out segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy opt out segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyOptOutSegmentManager(store: LegacyOptOutSegmentStore, clockValue: clock.Clock): LegacyOptOutSegmentManager {
  return new LegacyOptOutSegmentManager(
    store,
    defaultLegacyOptOutSegmentValidator(),
    clockValue,
    [],
    defaultLegacyOptOutSegmentEngine(),
  );
}
