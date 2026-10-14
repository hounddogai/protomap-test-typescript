import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalFunnelReviewEngine, defaultRegionalFunnelReviewEngine } from "./regional-funnel-review-engine.js";
import {
  RegionalFunnelReviewValidator,
  defaultRegionalFunnelReviewValidator,
} from "./regional-funnel-review-rules.js";
import { RegionalFunnelReviewStore } from "./regional-funnel-review-store.js";

/** Moves regional funnel reviews through their life cycle and keeps a journal of what it did. */
export class RegionalFunnelReviewWorkflow {
  store: RegionalFunnelReviewStore;
  validator: RegionalFunnelReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalFunnelReviewEngine;

  constructor(
    store: RegionalFunnelReviewStore,
    validator: RegionalFunnelReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalFunnelReviewEngine,
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
      throw new Error(`regional funnel review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional funnel review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional funnel review ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRegionalFunnelReviewWorkflow(store: RegionalFunnelReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalFunnelReviewWorkflow {
  return new RegionalFunnelReviewWorkflow(
    store,
    defaultRegionalFunnelReviewValidator(),
    clockValue,
    [],
    defaultRegionalFunnelReviewEngine(flagsValue),
  );
}
