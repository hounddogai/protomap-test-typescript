import * as clock from "../../../../kit/clock.js";
import { ApprovalWindowEngine, defaultApprovalWindowEngine } from "./approval-window-engine.js";
import { ApprovalWindowValidator, defaultApprovalWindowValidator } from "./approval-window-rules.js";
import { ApprovalWindowStore } from "./approval-window-store.js";

/** Moves approval windows through their life cycle and keeps a journal of what it did. */
export class ApprovalWindowManager {
  store: ApprovalWindowStore;
  validator: ApprovalWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalWindowEngine;

  constructor(
    store: ApprovalWindowStore,
    validator: ApprovalWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalWindowEngine,
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
      throw new Error(`approval window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval window ${code} not found`);
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
      throw new Error(`approval window ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newApprovalWindowManager(store: ApprovalWindowStore, clockValue: clock.Clock): ApprovalWindowManager {
  return new ApprovalWindowManager(
    store,
    defaultApprovalWindowValidator(),
    clockValue,
    [],
    defaultApprovalWindowEngine(),
  );
}
