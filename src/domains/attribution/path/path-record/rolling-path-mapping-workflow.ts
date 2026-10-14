import * as clock from "../../../../kit/clock.js";
import { RollingPathMappingEngine, defaultRollingPathMappingEngine } from "./rolling-path-mapping-engine.js";
import { RollingPathMappingValidator, defaultRollingPathMappingValidator } from "./rolling-path-mapping-rules.js";
import { RollingPathMappingStore } from "./rolling-path-mapping-store.js";

/** Moves rolling path mappings through their life cycle and keeps a journal of what it did. */
export class RollingPathMappingService {
  store: RollingPathMappingStore;
  validator: RollingPathMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPathMappingEngine;

  constructor(
    store: RollingPathMappingStore,
    validator: RollingPathMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPathMappingEngine,
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
      throw new Error(`rolling path mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling path mapping ${code} not found`);
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
      throw new Error(`rolling path mapping ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingPathMappingService(store: RollingPathMappingStore, clockValue: clock.Clock): RollingPathMappingService {
  return new RollingPathMappingService(
    store,
    defaultRollingPathMappingValidator(),
    clockValue,
    [],
    defaultRollingPathMappingEngine(),
  );
}
