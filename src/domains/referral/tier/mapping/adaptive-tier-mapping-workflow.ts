import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveTierMappingEngine, defaultAdaptiveTierMappingEngine } from "./adaptive-tier-mapping-engine.js";
import { AdaptiveTierMappingValidator, defaultAdaptiveTierMappingValidator } from "./adaptive-tier-mapping-rules.js";
import { AdaptiveTierMappingStore } from "./adaptive-tier-mapping-store.js";

/** Moves adaptive tier mappings through their life cycle and keeps a journal of what it did. */
export class AdaptiveTierMappingDesk {
  store: AdaptiveTierMappingStore;
  validator: AdaptiveTierMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveTierMappingEngine;

  constructor(
    store: AdaptiveTierMappingStore,
    validator: AdaptiveTierMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveTierMappingEngine,
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
      throw new Error(`adaptive tier mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive tier mapping ${code} not found`);
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
      throw new Error(`adaptive tier mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveTierMappingDesk(store: AdaptiveTierMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveTierMappingDesk {
  return new AdaptiveTierMappingDesk(
    store,
    defaultAdaptiveTierMappingValidator(),
    clockValue,
    [],
    defaultAdaptiveTierMappingEngine(flagsValue),
  );
}
