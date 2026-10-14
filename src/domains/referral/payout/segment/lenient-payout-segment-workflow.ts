import * as clock from "../../../../kit/clock.js";
import { LenientPayoutSegmentEngine, defaultLenientPayoutSegmentEngine } from "./lenient-payout-segment-engine.js";
import {
  LenientPayoutSegmentValidator,
  defaultLenientPayoutSegmentValidator,
} from "./lenient-payout-segment-rules.js";
import { LenientPayoutSegmentStore } from "./lenient-payout-segment-store.js";

/** Moves lenient payout segments through their life cycle and keeps a journal of what it did. */
export class LenientPayoutSegmentManager {
  store: LenientPayoutSegmentStore;
  validator: LenientPayoutSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPayoutSegmentEngine;

  constructor(
    store: LenientPayoutSegmentStore,
    validator: LenientPayoutSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPayoutSegmentEngine,
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
      throw new Error(`lenient payout segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient payout segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient payout segment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientPayoutSegmentManager(store: LenientPayoutSegmentStore, clockValue: clock.Clock): LenientPayoutSegmentManager {
  return new LenientPayoutSegmentManager(
    store,
    defaultLenientPayoutSegmentValidator(),
    clockValue,
    [],
    defaultLenientPayoutSegmentEngine(),
  );
}
