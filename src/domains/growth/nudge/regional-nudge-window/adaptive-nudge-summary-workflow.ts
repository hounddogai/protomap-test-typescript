import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveNudgeSummaryEngine, defaultAdaptiveNudgeSummaryEngine } from "./adaptive-nudge-summary-engine.js";
import {
  AdaptiveNudgeSummaryValidator,
  defaultAdaptiveNudgeSummaryValidator,
} from "./adaptive-nudge-summary-rules.js";
import { AdaptiveNudgeSummaryStore } from "./adaptive-nudge-summary-store.js";

/** Moves adaptive nudge summaries through their life cycle and keeps a journal of what it did. */
export class AdaptiveNudgeSummaryWorkflow {
  store: AdaptiveNudgeSummaryStore;
  validator: AdaptiveNudgeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveNudgeSummaryEngine;

  constructor(
    store: AdaptiveNudgeSummaryStore,
    validator: AdaptiveNudgeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveNudgeSummaryEngine,
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
      throw new Error(`adaptive nudge summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive nudge summary ${code} not found`);
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
      throw new Error(`adaptive nudge summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptiveNudgeSummaryWorkflow(store: AdaptiveNudgeSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveNudgeSummaryWorkflow {
  return new AdaptiveNudgeSummaryWorkflow(
    store,
    defaultAdaptiveNudgeSummaryValidator(),
    clockValue,
    [],
    defaultAdaptiveNudgeSummaryEngine(flagsValue),
  );
}
