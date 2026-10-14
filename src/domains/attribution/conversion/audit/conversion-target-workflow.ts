import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ConversionTargetEngine, defaultConversionTargetEngine } from "./conversion-target-engine.js";
import { ConversionTargetValidator, defaultConversionTargetValidator } from "./conversion-target-rules.js";
import { ConversionTargetStore } from "./conversion-target-store.js";

/** Moves conversion targets through their life cycle and keeps a journal of what it did. */
export class ConversionTargetWorkflow {
  store: ConversionTargetStore;
  validator: ConversionTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionTargetEngine;

  constructor(
    store: ConversionTargetStore,
    validator: ConversionTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionTargetEngine,
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
      throw new Error(`conversion target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion target ${code} not found`);
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
      throw new Error(`conversion target ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newConversionTargetWorkflow(store: ConversionTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): ConversionTargetWorkflow {
  return new ConversionTargetWorkflow(
    store,
    defaultConversionTargetValidator(),
    clockValue,
    [],
    defaultConversionTargetEngine(flagsValue),
  );
}
