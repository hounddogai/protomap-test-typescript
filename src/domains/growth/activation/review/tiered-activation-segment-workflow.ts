import * as clock from "../../../../kit/clock.js";
import {
  TieredActivationSegmentEngine,
  defaultTieredActivationSegmentEngine,
} from "./tiered-activation-segment-engine.js";
import {
  TieredActivationSegmentValidator,
  defaultTieredActivationSegmentValidator,
} from "./tiered-activation-segment-rules.js";
import { TieredActivationSegmentStore } from "./tiered-activation-segment-store.js";

/** Moves tiered activation segments through their life cycle and keeps a journal of what it did. */
export class TieredActivationSegmentManager {
  store: TieredActivationSegmentStore;
  validator: TieredActivationSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredActivationSegmentEngine;

  constructor(
    store: TieredActivationSegmentStore,
    validator: TieredActivationSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredActivationSegmentEngine,
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
      throw new Error(`tiered activation segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered activation segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered activation segment ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredActivationSegmentManager(store: TieredActivationSegmentStore, clockValue: clock.Clock): TieredActivationSegmentManager {
  return new TieredActivationSegmentManager(
    store,
    defaultTieredActivationSegmentValidator(),
    clockValue,
    [],
    defaultTieredActivationSegmentEngine(),
  );
}
