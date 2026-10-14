import * as clock from "../../../../kit/clock.js";
import { TieredStepNoticeEngine, defaultTieredStepNoticeEngine } from "./tiered-step-notice-engine.js";
import { TieredStepNoticeValidator, defaultTieredStepNoticeValidator } from "./tiered-step-notice-rules.js";
import { TieredStepNoticeStore } from "./tiered-step-notice-store.js";

/** Moves tiered step notices through their life cycle and keeps a journal of what it did. */
export class TieredStepNoticeCoordinator {
  store: TieredStepNoticeStore;
  validator: TieredStepNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredStepNoticeEngine;

  constructor(
    store: TieredStepNoticeStore,
    validator: TieredStepNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredStepNoticeEngine,
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
      throw new Error(`tiered step notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered step notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered step notice ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newTieredStepNoticeCoordinator(store: TieredStepNoticeStore, clockValue: clock.Clock): TieredStepNoticeCoordinator {
  return new TieredStepNoticeCoordinator(
    store,
    defaultTieredStepNoticeValidator(),
    clockValue,
    [],
    defaultTieredStepNoticeEngine(),
  );
}
