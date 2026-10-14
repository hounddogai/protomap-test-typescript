import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackPlacementTierEngine, defaultFallbackPlacementTierEngine } from "./fallback-placement-tier-engine.js";
import {
  FallbackPlacementTierValidator,
  defaultFallbackPlacementTierValidator,
} from "./fallback-placement-tier-rules.js";
import { FallbackPlacementTierStore } from "./fallback-placement-tier-store.js";

/** Moves fallback placement tiers through their life cycle and keeps a journal of what it did. */
export class FallbackPlacementTierCoordinator {
  store: FallbackPlacementTierStore;
  validator: FallbackPlacementTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackPlacementTierEngine;

  constructor(
    store: FallbackPlacementTierStore,
    validator: FallbackPlacementTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackPlacementTierEngine,
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
      throw new Error(`fallback placement tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback placement tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback placement tier ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackPlacementTierCoordinator(store: FallbackPlacementTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackPlacementTierCoordinator {
  return new FallbackPlacementTierCoordinator(
    store,
    defaultFallbackPlacementTierValidator(),
    clockValue,
    [],
    defaultFallbackPlacementTierEngine(flagsValue),
  );
}
