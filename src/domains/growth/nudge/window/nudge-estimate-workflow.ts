import * as clock from "../../../../kit/clock.js";
import { NudgeEstimateEngine, defaultNudgeEstimateEngine } from "./nudge-estimate-engine.js";
import { NudgeEstimateValidator, defaultNudgeEstimateValidator } from "./nudge-estimate-rules.js";
import { NudgeEstimateStore } from "./nudge-estimate-store.js";

/** Moves nudge estimates through their life cycle and keeps a journal of what it did. */
export class NudgeEstimateWorkflow {
  store: NudgeEstimateStore;
  validator: NudgeEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeEstimateEngine;

  constructor(
    store: NudgeEstimateStore,
    validator: NudgeEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeEstimateEngine,
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
      throw new Error(`nudge estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge estimate ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newNudgeEstimateWorkflow(store: NudgeEstimateStore, clockValue: clock.Clock): NudgeEstimateWorkflow {
  return new NudgeEstimateWorkflow(
    store,
    defaultNudgeEstimateValidator(),
    clockValue,
    [],
    defaultNudgeEstimateEngine(),
  );
}
