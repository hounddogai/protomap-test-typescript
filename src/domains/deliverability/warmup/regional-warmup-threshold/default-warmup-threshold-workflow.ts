import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultWarmupThresholdEngine,
  defaultDefaultWarmupThresholdEngine,
} from "./default-warmup-threshold-engine.js";
import {
  DefaultWarmupThresholdValidator,
  defaultDefaultWarmupThresholdValidator,
} from "./default-warmup-threshold-rules.js";
import { DefaultWarmupThresholdStore } from "./default-warmup-threshold-store.js";

/** Moves default warmup thresholds through their life cycle and keeps a journal of what it did. */
export class DefaultWarmupThresholdWorkflow {
  store: DefaultWarmupThresholdStore;
  validator: DefaultWarmupThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultWarmupThresholdEngine;

  constructor(
    store: DefaultWarmupThresholdStore,
    validator: DefaultWarmupThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultWarmupThresholdEngine,
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
      throw new Error(`default warmup threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default warmup threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default warmup threshold ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newDefaultWarmupThresholdWorkflow(store: DefaultWarmupThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultWarmupThresholdWorkflow {
  return new DefaultWarmupThresholdWorkflow(
    store,
    defaultDefaultWarmupThresholdValidator(),
    clockValue,
    [],
    defaultDefaultWarmupThresholdEngine(flagsValue),
  );
}
