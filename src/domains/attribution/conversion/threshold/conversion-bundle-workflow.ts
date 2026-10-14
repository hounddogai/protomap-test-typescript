import * as clock from "../../../../kit/clock.js";
import { ConversionBundleEngine, defaultConversionBundleEngine } from "./conversion-bundle-engine.js";
import { ConversionBundleValidator, defaultConversionBundleValidator } from "./conversion-bundle-rules.js";
import { ConversionBundleStore } from "./conversion-bundle-store.js";

/** Moves conversion bundles through their life cycle and keeps a journal of what it did. */
export class ConversionBundleWorkflow {
  store: ConversionBundleStore;
  validator: ConversionBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionBundleEngine;

  constructor(
    store: ConversionBundleStore,
    validator: ConversionBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionBundleEngine,
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
      throw new Error(`conversion bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion bundle ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newConversionBundleWorkflow(store: ConversionBundleStore, clockValue: clock.Clock): ConversionBundleWorkflow {
  return new ConversionBundleWorkflow(
    store,
    defaultConversionBundleValidator(),
    clockValue,
    [],
    defaultConversionBundleEngine(),
  );
}
