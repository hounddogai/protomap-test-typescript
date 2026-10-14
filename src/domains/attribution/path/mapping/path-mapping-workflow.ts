import * as clock from "../../../../kit/clock.js";
import { PathMappingEngine, defaultPathMappingEngine } from "./path-mapping-engine.js";
import { PathMappingValidator, defaultPathMappingValidator } from "./path-mapping-rules.js";
import { PathMappingStore } from "./path-mapping-store.js";

/** Moves path mappings through their life cycle and keeps a journal of what it did. */
export class PathMappingManager {
  store: PathMappingStore;
  validator: PathMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathMappingEngine;

  constructor(
    store: PathMappingStore,
    validator: PathMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathMappingEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path mapping ${code} not found`);
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
      throw new Error(`path mapping ${code} not found`);
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

export function newPathMappingManager(store: PathMappingStore, clockValue: clock.Clock): PathMappingManager {
  return new PathMappingManager(store, defaultPathMappingValidator(), clockValue, [], defaultPathMappingEngine());
}
