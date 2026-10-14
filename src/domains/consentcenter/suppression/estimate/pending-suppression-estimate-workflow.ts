import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingSuppressionEstimateEngine,
  defaultPendingSuppressionEstimateEngine,
} from "./pending-suppression-estimate-engine.js";
import {
  PendingSuppressionEstimateValidator,
  defaultPendingSuppressionEstimateValidator,
} from "./pending-suppression-estimate-rules.js";
import { PendingSuppressionEstimateStore } from "./pending-suppression-estimate-store.js";

/** Moves pending suppression estimates through their life cycle and keeps a journal of what it did. */
export class PendingSuppressionEstimateWorkflow {
  store: PendingSuppressionEstimateStore;
  validator: PendingSuppressionEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingSuppressionEstimateEngine;

  constructor(
    store: PendingSuppressionEstimateStore,
    validator: PendingSuppressionEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingSuppressionEstimateEngine,
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
      throw new Error(`pending suppression estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending suppression estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending suppression estimate ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPendingSuppressionEstimateWorkflow(store: PendingSuppressionEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingSuppressionEstimateWorkflow {
  return new PendingSuppressionEstimateWorkflow(
    store,
    defaultPendingSuppressionEstimateValidator(),
    clockValue,
    [],
    defaultPendingSuppressionEstimateEngine(flagsValue),
  );
}
