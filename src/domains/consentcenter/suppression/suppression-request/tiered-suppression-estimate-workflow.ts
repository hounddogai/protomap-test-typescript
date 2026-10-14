import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredSuppressionEstimateEngine,
  defaultTieredSuppressionEstimateEngine,
} from "./tiered-suppression-estimate-engine.js";
import {
  TieredSuppressionEstimateValidator,
  defaultTieredSuppressionEstimateValidator,
} from "./tiered-suppression-estimate-rules.js";
import { TieredSuppressionEstimateStore } from "./tiered-suppression-estimate-store.js";

/** Moves tiered suppression estimates through their life cycle and keeps a journal of what it did. */
export class TieredSuppressionEstimateManager {
  store: TieredSuppressionEstimateStore;
  validator: TieredSuppressionEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredSuppressionEstimateEngine;

  constructor(
    store: TieredSuppressionEstimateStore,
    validator: TieredSuppressionEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredSuppressionEstimateEngine,
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
      throw new Error(`tiered suppression estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered suppression estimate ${code} not found`);
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
      throw new Error(`tiered suppression estimate ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredSuppressionEstimateManager(store: TieredSuppressionEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredSuppressionEstimateManager {
  return new TieredSuppressionEstimateManager(
    store,
    defaultTieredSuppressionEstimateValidator(),
    clockValue,
    [],
    defaultTieredSuppressionEstimateEngine(flagsValue),
  );
}
