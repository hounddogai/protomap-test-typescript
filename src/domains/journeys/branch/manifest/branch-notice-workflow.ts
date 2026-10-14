import * as clock from "../../../../kit/clock.js";
import { BranchNoticeEngine, defaultBranchNoticeEngine } from "./branch-notice-engine.js";
import { BranchNoticeValidator, defaultBranchNoticeValidator } from "./branch-notice-rules.js";
import { BranchNoticeStore } from "./branch-notice-store.js";

/** Moves branch notices through their life cycle and keeps a journal of what it did. */
export class BranchNoticeCoordinator {
  store: BranchNoticeStore;
  validator: BranchNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchNoticeEngine;

  constructor(
    store: BranchNoticeStore,
    validator: BranchNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchNoticeEngine,
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
      throw new Error(`branch notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch notice ${code} not found`);
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
      throw new Error(`branch notice ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBranchNoticeCoordinator(store: BranchNoticeStore, clockValue: clock.Clock): BranchNoticeCoordinator {
  return new BranchNoticeCoordinator(
    store,
    defaultBranchNoticeValidator(),
    clockValue,
    [],
    defaultBranchNoticeEngine(),
  );
}
