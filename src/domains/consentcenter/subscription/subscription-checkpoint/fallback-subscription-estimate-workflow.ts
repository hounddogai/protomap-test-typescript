import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackSubscriptionEstimateEngine,
  defaultFallbackSubscriptionEstimateEngine,
} from "./fallback-subscription-estimate-engine.js";
import {
  FallbackSubscriptionEstimateValidator,
  defaultFallbackSubscriptionEstimateValidator,
} from "./fallback-subscription-estimate-rules.js";
import { FallbackSubscriptionEstimateStore } from "./fallback-subscription-estimate-store.js";

/** Moves fallback subscription estimates through their life cycle and keeps a journal of what it did. */
export class FallbackSubscriptionEstimateWorkflow {
  store: FallbackSubscriptionEstimateStore;
  validator: FallbackSubscriptionEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackSubscriptionEstimateEngine;

  constructor(
    store: FallbackSubscriptionEstimateStore,
    validator: FallbackSubscriptionEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackSubscriptionEstimateEngine,
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
      throw new Error(`fallback subscription estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback subscription estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback subscription estimate ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFallbackSubscriptionEstimateWorkflow(store: FallbackSubscriptionEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackSubscriptionEstimateWorkflow {
  return new FallbackSubscriptionEstimateWorkflow(
    store,
    defaultFallbackSubscriptionEstimateValidator(),
    clockValue,
    [],
    defaultFallbackSubscriptionEstimateEngine(flagsValue),
  );
}
