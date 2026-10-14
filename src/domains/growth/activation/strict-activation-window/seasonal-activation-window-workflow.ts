import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalActivationWindowEngine,
  defaultSeasonalActivationWindowEngine,
} from "./seasonal-activation-window-engine.js";
import {
  SeasonalActivationWindowValidator,
  defaultSeasonalActivationWindowValidator,
} from "./seasonal-activation-window-rules.js";
import { SeasonalActivationWindowStore } from "./seasonal-activation-window-store.js";

/** Moves seasonal activation windows through their life cycle and keeps a journal of what it did. */
export class SeasonalActivationWindowCoordinator {
  store: SeasonalActivationWindowStore;
  validator: SeasonalActivationWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalActivationWindowEngine;

  constructor(
    store: SeasonalActivationWindowStore,
    validator: SeasonalActivationWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalActivationWindowEngine,
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
      throw new Error(`seasonal activation window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal activation window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal activation window ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newSeasonalActivationWindowCoordinator(store: SeasonalActivationWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalActivationWindowCoordinator {
  return new SeasonalActivationWindowCoordinator(
    store,
    defaultSeasonalActivationWindowValidator(),
    clockValue,
    [],
    defaultSeasonalActivationWindowEngine(flagsValue),
  );
}
