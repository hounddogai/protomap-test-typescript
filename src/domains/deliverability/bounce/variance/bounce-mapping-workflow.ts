import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BounceMappingEngine, defaultBounceMappingEngine } from "./bounce-mapping-engine.js";
import { BounceMappingValidator, defaultBounceMappingValidator } from "./bounce-mapping-rules.js";
import { BounceMappingStore } from "./bounce-mapping-store.js";

/** Moves bounce mappings through their life cycle and keeps a journal of what it did. */
export class BounceMappingManager {
  store: BounceMappingStore;
  validator: BounceMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceMappingEngine;

  constructor(
    store: BounceMappingStore,
    validator: BounceMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceMappingEngine,
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
      throw new Error(`bounce mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce mapping ${code} not found`);
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

export function newBounceMappingManager(store: BounceMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): BounceMappingManager {
  return new BounceMappingManager(
    store,
    defaultBounceMappingValidator(),
    clockValue,
    [],
    defaultBounceMappingEngine(flagsValue),
  );
}
