import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredDomainThresholdEngine, defaultTieredDomainThresholdEngine } from "./tiered-domain-threshold-engine.js";
import {
  TieredDomainThresholdValidator,
  defaultTieredDomainThresholdValidator,
} from "./tiered-domain-threshold-rules.js";
import { TieredDomainThresholdStore } from "./tiered-domain-threshold-store.js";

/** Moves tiered domain thresholds through their life cycle and keeps a journal of what it did. */
export class TieredDomainThresholdDesk {
  store: TieredDomainThresholdStore;
  validator: TieredDomainThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredDomainThresholdEngine;

  constructor(
    store: TieredDomainThresholdStore,
    validator: TieredDomainThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredDomainThresholdEngine,
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
      throw new Error(`tiered domain threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered domain threshold ${code} not found`);
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
      throw new Error(`tiered domain threshold ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTieredDomainThresholdDesk(store: TieredDomainThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredDomainThresholdDesk {
  return new TieredDomainThresholdDesk(
    store,
    defaultTieredDomainThresholdValidator(),
    clockValue,
    [],
    defaultTieredDomainThresholdEngine(flagsValue),
  );
}
