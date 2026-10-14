import * as clock from "../../../../kit/clock.js";
import { RollingWarmupMappingEngine, defaultRollingWarmupMappingEngine } from "./rolling-warmup-mapping-engine.js";
import {
  RollingWarmupMappingValidator,
  defaultRollingWarmupMappingValidator,
} from "./rolling-warmup-mapping-rules.js";
import { RollingWarmupMappingStore } from "./rolling-warmup-mapping-store.js";

/** Moves rolling warmup mappings through their life cycle and keeps a journal of what it did. */
export class RollingWarmupMappingCoordinator {
  store: RollingWarmupMappingStore;
  validator: RollingWarmupMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingWarmupMappingEngine;

  constructor(
    store: RollingWarmupMappingStore,
    validator: RollingWarmupMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingWarmupMappingEngine,
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
      throw new Error(`rolling warmup mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling warmup mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling warmup mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRollingWarmupMappingCoordinator(store: RollingWarmupMappingStore, clockValue: clock.Clock): RollingWarmupMappingCoordinator {
  return new RollingWarmupMappingCoordinator(
    store,
    defaultRollingWarmupMappingValidator(),
    clockValue,
    [],
    defaultRollingWarmupMappingEngine(),
  );
}
