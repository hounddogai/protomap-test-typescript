import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { NudgeBaselineEngine, defaultNudgeBaselineEngine } from "./nudge-baseline-engine.js";
import { NudgeBaselineValidator, defaultNudgeBaselineValidator } from "./nudge-baseline-rules.js";
import { NudgeBaselineStore } from "./nudge-baseline-store.js";

/** Moves nudge baselines through their life cycle and keeps a journal of what it did. */
export class NudgeBaselineCoordinator {
  store: NudgeBaselineStore;
  validator: NudgeBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeBaselineEngine;

  constructor(
    store: NudgeBaselineStore,
    validator: NudgeBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeBaselineEngine,
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
      throw new Error(`nudge baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge baseline ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newNudgeBaselineCoordinator(store: NudgeBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): NudgeBaselineCoordinator {
  return new NudgeBaselineCoordinator(
    store,
    defaultNudgeBaselineValidator(),
    clockValue,
    [],
    defaultNudgeBaselineEngine(flagsValue),
  );
}
