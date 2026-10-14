import * as clock from "../../../../kit/clock.js";
import { PacingMappingEngine, defaultPacingMappingEngine } from "./pacing-mapping-engine.js";
import { PacingMappingValidator, defaultPacingMappingValidator } from "./pacing-mapping-rules.js";
import { PacingMappingStore } from "./pacing-mapping-store.js";

/** Moves pacing mappings through their life cycle and keeps a journal of what it did. */
export class PacingMappingWorkflow {
  store: PacingMappingStore;
  validator: PacingMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingMappingEngine;

  constructor(
    store: PacingMappingStore,
    validator: PacingMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingMappingEngine,
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
      throw new Error(`pacing mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing mapping ${code} not found`);
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

export function newPacingMappingWorkflow(store: PacingMappingStore, clockValue: clock.Clock): PacingMappingWorkflow {
  return new PacingMappingWorkflow(
    store,
    defaultPacingMappingValidator(),
    clockValue,
    [],
    defaultPacingMappingEngine(),
  );
}
