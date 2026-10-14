import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimaryConversionMappingEngine,
  defaultPrimaryConversionMappingEngine,
} from "./primary-conversion-mapping-engine.js";
import {
  PrimaryConversionMappingValidator,
  defaultPrimaryConversionMappingValidator,
} from "./primary-conversion-mapping-rules.js";
import { PrimaryConversionMappingStore } from "./primary-conversion-mapping-store.js";

/** Moves primary conversion mappings through their life cycle and keeps a journal of what it did. */
export class PrimaryConversionMappingCoordinator {
  store: PrimaryConversionMappingStore;
  validator: PrimaryConversionMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryConversionMappingEngine;

  constructor(
    store: PrimaryConversionMappingStore,
    validator: PrimaryConversionMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryConversionMappingEngine,
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
      throw new Error(`primary conversion mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary conversion mapping ${code} not found`);
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
      throw new Error(`primary conversion mapping ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryConversionMappingCoordinator(store: PrimaryConversionMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryConversionMappingCoordinator {
  return new PrimaryConversionMappingCoordinator(
    store,
    defaultPrimaryConversionMappingValidator(),
    clockValue,
    [],
    defaultPrimaryConversionMappingEngine(flagsValue),
  );
}
