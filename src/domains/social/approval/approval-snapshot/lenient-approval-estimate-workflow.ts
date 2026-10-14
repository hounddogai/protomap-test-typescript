import * as clock from "../../../../kit/clock.js";
import {
  LenientApprovalEstimateEngine,
  defaultLenientApprovalEstimateEngine,
} from "./lenient-approval-estimate-engine.js";
import {
  LenientApprovalEstimateValidator,
  defaultLenientApprovalEstimateValidator,
} from "./lenient-approval-estimate-rules.js";
import { LenientApprovalEstimateStore } from "./lenient-approval-estimate-store.js";

/** Moves lenient approval estimates through their life cycle and keeps a journal of what it did. */
export class LenientApprovalEstimateCoordinator {
  store: LenientApprovalEstimateStore;
  validator: LenientApprovalEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientApprovalEstimateEngine;

  constructor(
    store: LenientApprovalEstimateStore,
    validator: LenientApprovalEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientApprovalEstimateEngine,
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
      throw new Error(`lenient approval estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient approval estimate ${code} not found`);
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
      throw new Error(`lenient approval estimate ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientApprovalEstimateCoordinator(store: LenientApprovalEstimateStore, clockValue: clock.Clock): LenientApprovalEstimateCoordinator {
  return new LenientApprovalEstimateCoordinator(
    store,
    defaultLenientApprovalEstimateValidator(),
    clockValue,
    [],
    defaultLenientApprovalEstimateEngine(),
  );
}
