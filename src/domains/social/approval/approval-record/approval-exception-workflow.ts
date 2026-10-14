import * as clock from "../../../../kit/clock.js";
import { ApprovalExceptionEngine, defaultApprovalExceptionEngine } from "./approval-exception-engine.js";
import { ApprovalExceptionValidator, defaultApprovalExceptionValidator } from "./approval-exception-rules.js";
import { ApprovalExceptionStore } from "./approval-exception-store.js";

/** Moves approval exceptions through their life cycle and keeps a journal of what it did. */
export class ApprovalExceptionService {
  store: ApprovalExceptionStore;
  validator: ApprovalExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalExceptionEngine;

  constructor(
    store: ApprovalExceptionStore,
    validator: ApprovalExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalExceptionEngine,
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
      throw new Error(`approval exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval exception ${code} not found`);
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

export function newApprovalExceptionService(store: ApprovalExceptionStore, clockValue: clock.Clock): ApprovalExceptionService {
  return new ApprovalExceptionService(
    store,
    defaultApprovalExceptionValidator(),
    clockValue,
    [],
    defaultApprovalExceptionEngine(),
  );
}
