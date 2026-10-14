import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveBadgeWindowEngine, defaultAdaptiveBadgeWindowEngine } from "./adaptive-badge-window-engine.js";
import { AdaptiveBadgeWindowValidator, defaultAdaptiveBadgeWindowValidator } from "./adaptive-badge-window-rules.js";
import { AdaptiveBadgeWindowStore } from "./adaptive-badge-window-store.js";

/** Moves adaptive badge windows through their life cycle and keeps a journal of what it did. */
export class AdaptiveBadgeWindowManager {
  store: AdaptiveBadgeWindowStore;
  validator: AdaptiveBadgeWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveBadgeWindowEngine;

  constructor(
    store: AdaptiveBadgeWindowStore,
    validator: AdaptiveBadgeWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveBadgeWindowEngine,
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
      throw new Error(`adaptive badge window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive badge window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive badge window ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptiveBadgeWindowManager(store: AdaptiveBadgeWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveBadgeWindowManager {
  return new AdaptiveBadgeWindowManager(
    store,
    defaultAdaptiveBadgeWindowValidator(),
    clockValue,
    [],
    defaultAdaptiveBadgeWindowEngine(flagsValue),
  );
}
