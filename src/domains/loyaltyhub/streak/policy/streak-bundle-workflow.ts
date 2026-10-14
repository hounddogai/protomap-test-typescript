import * as clock from "../../../../kit/clock.js";
import { StreakBundleEngine, defaultStreakBundleEngine } from "./streak-bundle-engine.js";
import { StreakBundleValidator, defaultStreakBundleValidator } from "./streak-bundle-rules.js";
import { StreakBundleStore } from "./streak-bundle-store.js";

/** Moves streak bundles through their life cycle and keeps a journal of what it did. */
export class StreakBundleCoordinator {
  store: StreakBundleStore;
  validator: StreakBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakBundleEngine;

  constructor(
    store: StreakBundleStore,
    validator: StreakBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakBundleEngine,
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
      throw new Error(`streak bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak bundle ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStreakBundleCoordinator(store: StreakBundleStore, clockValue: clock.Clock): StreakBundleCoordinator {
  return new StreakBundleCoordinator(
    store,
    defaultStreakBundleValidator(),
    clockValue,
    [],
    defaultStreakBundleEngine(),
  );
}
