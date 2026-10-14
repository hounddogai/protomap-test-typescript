import * as clock from "../../../../kit/clock.js";
import {
  FallbackSuppressionGroupEngine,
  defaultFallbackSuppressionGroupEngine,
} from "./fallback-suppression-group-engine.js";
import {
  FallbackSuppressionGroupValidator,
  defaultFallbackSuppressionGroupValidator,
} from "./fallback-suppression-group-rules.js";
import { FallbackSuppressionGroupStore } from "./fallback-suppression-group-store.js";

/** Moves fallback suppression groups through their life cycle and keeps a journal of what it did. */
export class FallbackSuppressionGroupDesk {
  store: FallbackSuppressionGroupStore;
  validator: FallbackSuppressionGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackSuppressionGroupEngine;

  constructor(
    store: FallbackSuppressionGroupStore,
    validator: FallbackSuppressionGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackSuppressionGroupEngine,
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
      throw new Error(`fallback suppression group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback suppression group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback suppression group ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFallbackSuppressionGroupDesk(store: FallbackSuppressionGroupStore, clockValue: clock.Clock): FallbackSuppressionGroupDesk {
  return new FallbackSuppressionGroupDesk(
    store,
    defaultFallbackSuppressionGroupValidator(),
    clockValue,
    [],
    defaultFallbackSuppressionGroupEngine(),
  );
}
