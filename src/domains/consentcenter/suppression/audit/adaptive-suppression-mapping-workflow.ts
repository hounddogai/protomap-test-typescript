import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveSuppressionMappingEngine,
  defaultAdaptiveSuppressionMappingEngine,
} from "./adaptive-suppression-mapping-engine.js";
import {
  AdaptiveSuppressionMappingValidator,
  defaultAdaptiveSuppressionMappingValidator,
} from "./adaptive-suppression-mapping-rules.js";
import { AdaptiveSuppressionMappingStore } from "./adaptive-suppression-mapping-store.js";

/** Moves adaptive suppression mappings through their life cycle and keeps a journal of what it did. */
export class AdaptiveSuppressionMappingService {
  store: AdaptiveSuppressionMappingStore;
  validator: AdaptiveSuppressionMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveSuppressionMappingEngine;

  constructor(
    store: AdaptiveSuppressionMappingStore,
    validator: AdaptiveSuppressionMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveSuppressionMappingEngine,
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
      throw new Error(`adaptive suppression mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive suppression mapping ${code} not found`);
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
      throw new Error(`adaptive suppression mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newAdaptiveSuppressionMappingService(store: AdaptiveSuppressionMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveSuppressionMappingService {
  return new AdaptiveSuppressionMappingService(
    store,
    defaultAdaptiveSuppressionMappingValidator(),
    clockValue,
    [],
    defaultAdaptiveSuppressionMappingEngine(flagsValue),
  );
}
