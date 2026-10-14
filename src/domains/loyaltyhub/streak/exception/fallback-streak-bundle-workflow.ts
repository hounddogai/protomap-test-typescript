import * as clock from "../../../../kit/clock.js";
import { FallbackStreakBundleEngine, defaultFallbackStreakBundleEngine } from "./fallback-streak-bundle-engine.js";
import {
  FallbackStreakBundleValidator,
  defaultFallbackStreakBundleValidator,
} from "./fallback-streak-bundle-rules.js";
import { FallbackStreakBundleStore } from "./fallback-streak-bundle-store.js";

/** Moves fallback streak bundles through their life cycle and keeps a journal of what it did. */
export class FallbackStreakBundleDesk {
  store: FallbackStreakBundleStore;
  validator: FallbackStreakBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackStreakBundleEngine;

  constructor(
    store: FallbackStreakBundleStore,
    validator: FallbackStreakBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackStreakBundleEngine,
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
      throw new Error(`fallback streak bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback streak bundle ${code} not found`);
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
      throw new Error(`fallback streak bundle ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackStreakBundleDesk(store: FallbackStreakBundleStore, clockValue: clock.Clock): FallbackStreakBundleDesk {
  return new FallbackStreakBundleDesk(
    store,
    defaultFallbackStreakBundleValidator(),
    clockValue,
    [],
    defaultFallbackStreakBundleEngine(),
  );
}
