import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReputationEstimateEngine, defaultReputationEstimateEngine } from "./reputation-estimate-engine.js";
import { ReputationEstimateValidator, defaultReputationEstimateValidator } from "./reputation-estimate-rules.js";
import { ReputationEstimateStore } from "./reputation-estimate-store.js";

/** Moves reputation estimates through their life cycle and keeps a journal of what it did. */
export class ReputationEstimateManager {
  store: ReputationEstimateStore;
  validator: ReputationEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationEstimateEngine;

  constructor(
    store: ReputationEstimateStore,
    validator: ReputationEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationEstimateEngine,
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
      throw new Error(`reputation estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newReputationEstimateManager(store: ReputationEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReputationEstimateManager {
  return new ReputationEstimateManager(
    store,
    defaultReputationEstimateValidator(),
    clockValue,
    [],
    defaultReputationEstimateEngine(flagsValue),
  );
}
