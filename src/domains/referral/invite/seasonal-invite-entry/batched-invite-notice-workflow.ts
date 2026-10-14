import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedInviteNoticeEngine, defaultBatchedInviteNoticeEngine } from "./batched-invite-notice-engine.js";
import { BatchedInviteNoticeValidator, defaultBatchedInviteNoticeValidator } from "./batched-invite-notice-rules.js";
import { BatchedInviteNoticeStore } from "./batched-invite-notice-store.js";

/** Moves batched invite notices through their life cycle and keeps a journal of what it did. */
export class BatchedInviteNoticeWorkflow {
  store: BatchedInviteNoticeStore;
  validator: BatchedInviteNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedInviteNoticeEngine;

  constructor(
    store: BatchedInviteNoticeStore,
    validator: BatchedInviteNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedInviteNoticeEngine,
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
      throw new Error(`batched invite notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched invite notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched invite notice ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedInviteNoticeWorkflow(store: BatchedInviteNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedInviteNoticeWorkflow {
  return new BatchedInviteNoticeWorkflow(
    store,
    defaultBatchedInviteNoticeValidator(),
    clockValue,
    [],
    defaultBatchedInviteNoticeEngine(flagsValue),
  );
}
