import * as clock from "../../../../kit/clock.js";
import { PendingStreakBundleEngine, defaultPendingStreakBundleEngine } from "./pending-streak-bundle-engine.js";
import { PendingStreakBundleValidator, defaultPendingStreakBundleValidator } from "./pending-streak-bundle-rules.js";
import { PendingStreakBundleStore } from "./pending-streak-bundle-store.js";

/** Moves pending streak bundles through their life cycle and keeps a journal of what it did. */
export class PendingStreakBundleWorkflow {
  store: PendingStreakBundleStore;
  validator: PendingStreakBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingStreakBundleEngine;

  constructor(
    store: PendingStreakBundleStore,
    validator: PendingStreakBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingStreakBundleEngine,
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
      throw new Error(`pending streak bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending streak bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending streak bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPendingStreakBundleWorkflow(store: PendingStreakBundleStore, clockValue: clock.Clock): PendingStreakBundleWorkflow {
  return new PendingStreakBundleWorkflow(
    store,
    defaultPendingStreakBundleValidator(),
    clockValue,
    [],
    defaultPendingStreakBundleEngine(),
  );
}
