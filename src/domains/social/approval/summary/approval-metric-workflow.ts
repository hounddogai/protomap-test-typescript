import * as clock from "../../../../kit/clock.js";
import { ApprovalMetricEngine, defaultApprovalMetricEngine } from "./approval-metric-engine.js";
import { ApprovalMetricValidator, defaultApprovalMetricValidator } from "./approval-metric-rules.js";
import { ApprovalMetricStore } from "./approval-metric-store.js";

/** Moves approval metrics through their life cycle and keeps a journal of what it did. */
export class ApprovalMetricWorkflow {
  store: ApprovalMetricStore;
  validator: ApprovalMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalMetricEngine;

  constructor(
    store: ApprovalMetricStore,
    validator: ApprovalMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalMetricEngine,
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
      throw new Error(`approval metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval metric ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newApprovalMetricWorkflow(store: ApprovalMetricStore, clockValue: clock.Clock): ApprovalMetricWorkflow {
  return new ApprovalMetricWorkflow(
    store,
    defaultApprovalMetricValidator(),
    clockValue,
    [],
    defaultApprovalMetricEngine(),
  );
}
