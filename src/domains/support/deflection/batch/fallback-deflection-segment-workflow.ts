import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackDeflectionSegmentEngine,
  defaultFallbackDeflectionSegmentEngine,
} from "./fallback-deflection-segment-engine.js";
import {
  FallbackDeflectionSegmentValidator,
  defaultFallbackDeflectionSegmentValidator,
} from "./fallback-deflection-segment-rules.js";
import { FallbackDeflectionSegmentStore } from "./fallback-deflection-segment-store.js";

/** Moves fallback deflection segments through their life cycle and keeps a journal of what it did. */
export class FallbackDeflectionSegmentService {
  store: FallbackDeflectionSegmentStore;
  validator: FallbackDeflectionSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackDeflectionSegmentEngine;

  constructor(
    store: FallbackDeflectionSegmentStore,
    validator: FallbackDeflectionSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackDeflectionSegmentEngine,
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
      throw new Error(`fallback deflection segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback deflection segment ${code} not found`);
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
      throw new Error(`fallback deflection segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newFallbackDeflectionSegmentService(store: FallbackDeflectionSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackDeflectionSegmentService {
  return new FallbackDeflectionSegmentService(
    store,
    defaultFallbackDeflectionSegmentValidator(),
    clockValue,
    [],
    defaultFallbackDeflectionSegmentEngine(flagsValue),
  );
}
