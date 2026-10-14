import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalCreativeReviewEngine,
  defaultRegionalCreativeReviewEngine,
} from "./regional-creative-review-engine.js";
import {
  RegionalCreativeReviewValidator,
  defaultRegionalCreativeReviewValidator,
} from "./regional-creative-review-rules.js";
import { RegionalCreativeReviewStore } from "./regional-creative-review-store.js";

/** Moves regional creative reviews through their life cycle and keeps a journal of what it did. */
export class RegionalCreativeReviewWorkflow {
  store: RegionalCreativeReviewStore;
  validator: RegionalCreativeReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalCreativeReviewEngine;

  constructor(
    store: RegionalCreativeReviewStore,
    validator: RegionalCreativeReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalCreativeReviewEngine,
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
      throw new Error(`regional creative review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional creative review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional creative review ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalCreativeReviewWorkflow(store: RegionalCreativeReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalCreativeReviewWorkflow {
  return new RegionalCreativeReviewWorkflow(
    store,
    defaultRegionalCreativeReviewValidator(),
    clockValue,
    [],
    defaultRegionalCreativeReviewEngine(flagsValue),
  );
}
