import * as clock from "../../../../kit/clock.js";
import {
  DefaultReputationMappingEngine,
  defaultDefaultReputationMappingEngine,
} from "./default-reputation-mapping-engine.js";
import {
  DefaultReputationMappingValidator,
  defaultDefaultReputationMappingValidator,
} from "./default-reputation-mapping-rules.js";
import { DefaultReputationMappingStore } from "./default-reputation-mapping-store.js";

/** Moves default reputation mappings through their life cycle and keeps a journal of what it did. */
export class DefaultReputationMappingManager {
  store: DefaultReputationMappingStore;
  validator: DefaultReputationMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultReputationMappingEngine;

  constructor(
    store: DefaultReputationMappingStore,
    validator: DefaultReputationMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultReputationMappingEngine,
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
      throw new Error(`default reputation mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reputation mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reputation mapping ${code} not found`);
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

export function newDefaultReputationMappingManager(store: DefaultReputationMappingStore, clockValue: clock.Clock): DefaultReputationMappingManager {
  return new DefaultReputationMappingManager(
    store,
    defaultDefaultReputationMappingValidator(),
    clockValue,
    [],
    defaultDefaultReputationMappingEngine(),
  );
}
