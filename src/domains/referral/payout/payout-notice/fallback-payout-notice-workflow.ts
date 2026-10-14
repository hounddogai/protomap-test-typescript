import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackPayoutNoticeEngine, defaultFallbackPayoutNoticeEngine } from "./fallback-payout-notice-engine.js";
import {
  FallbackPayoutNoticeValidator,
  defaultFallbackPayoutNoticeValidator,
} from "./fallback-payout-notice-rules.js";
import { FallbackPayoutNoticeStore } from "./fallback-payout-notice-store.js";

/** Moves fallback payout notices through their life cycle and keeps a journal of what it did. */
export class FallbackPayoutNoticeWorkflow {
  store: FallbackPayoutNoticeStore;
  validator: FallbackPayoutNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackPayoutNoticeEngine;

  constructor(
    store: FallbackPayoutNoticeStore,
    validator: FallbackPayoutNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackPayoutNoticeEngine,
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
      throw new Error(`fallback payout notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback payout notice ${code} not found`);
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
      throw new Error(`fallback payout notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newFallbackPayoutNoticeWorkflow(store: FallbackPayoutNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackPayoutNoticeWorkflow {
  return new FallbackPayoutNoticeWorkflow(
    store,
    defaultFallbackPayoutNoticeValidator(),
    clockValue,
    [],
    defaultFallbackPayoutNoticeEngine(flagsValue),
  );
}
