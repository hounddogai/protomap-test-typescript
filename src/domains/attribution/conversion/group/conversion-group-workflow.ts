import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ConversionGroupEngine, defaultConversionGroupEngine } from "./conversion-group-engine.js";
import { ConversionGroupValidator, defaultConversionGroupValidator } from "./conversion-group-rules.js";
import { ConversionGroupStore } from "./conversion-group-store.js";

/** Moves conversion groups through their life cycle and keeps a journal of what it did. */
export class ConversionGroupWorkflow {
  store: ConversionGroupStore;
  validator: ConversionGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionGroupEngine;

  constructor(
    store: ConversionGroupStore,
    validator: ConversionGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionGroupEngine,
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
      throw new Error(`conversion group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newConversionGroupWorkflow(store: ConversionGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): ConversionGroupWorkflow {
  return new ConversionGroupWorkflow(
    store,
    defaultConversionGroupValidator(),
    clockValue,
    [],
    defaultConversionGroupEngine(flagsValue),
  );
}
