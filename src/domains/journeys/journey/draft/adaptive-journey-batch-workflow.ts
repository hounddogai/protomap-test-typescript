import * as clock from "../../../../kit/clock.js";
import { AdaptiveJourneyBatchEngine, defaultAdaptiveJourneyBatchEngine } from "./adaptive-journey-batch-engine.js";
import {
  AdaptiveJourneyBatchValidator,
  defaultAdaptiveJourneyBatchValidator,
} from "./adaptive-journey-batch-rules.js";
import { AdaptiveJourneyBatchStore } from "./adaptive-journey-batch-store.js";

/** Moves adaptive journey batches through their life cycle and keeps a journal of what it did. */
export class AdaptiveJourneyBatchManager {
  store: AdaptiveJourneyBatchStore;
  validator: AdaptiveJourneyBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveJourneyBatchEngine;

  constructor(
    store: AdaptiveJourneyBatchStore,
    validator: AdaptiveJourneyBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveJourneyBatchEngine,
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
      throw new Error(`adaptive journey batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive journey batch ${code} not found`);
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
      throw new Error(`adaptive journey batch ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveJourneyBatchManager(store: AdaptiveJourneyBatchStore, clockValue: clock.Clock): AdaptiveJourneyBatchManager {
  return new AdaptiveJourneyBatchManager(
    store,
    defaultAdaptiveJourneyBatchValidator(),
    clockValue,
    [],
    defaultAdaptiveJourneyBatchEngine(),
  );
}
