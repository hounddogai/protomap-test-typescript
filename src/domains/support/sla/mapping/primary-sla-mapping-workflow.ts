import * as clock from "../../../../kit/clock.js";
import { PrimarySlaMappingEngine, defaultPrimarySlaMappingEngine } from "./primary-sla-mapping-engine.js";
import { PrimarySlaMappingValidator, defaultPrimarySlaMappingValidator } from "./primary-sla-mapping-rules.js";
import { PrimarySlaMappingStore } from "./primary-sla-mapping-store.js";

/** Moves primary sla mappings through their life cycle and keeps a journal of what it did. */
export class PrimarySlaMappingManager {
  store: PrimarySlaMappingStore;
  validator: PrimarySlaMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimarySlaMappingEngine;

  constructor(
    store: PrimarySlaMappingStore,
    validator: PrimarySlaMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimarySlaMappingEngine,
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
      throw new Error(`primary sla mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sla mapping ${code} not found`);
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
      throw new Error(`primary sla mapping ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPrimarySlaMappingManager(store: PrimarySlaMappingStore, clockValue: clock.Clock): PrimarySlaMappingManager {
  return new PrimarySlaMappingManager(
    store,
    defaultPrimarySlaMappingValidator(),
    clockValue,
    [],
    defaultPrimarySlaMappingEngine(),
  );
}
