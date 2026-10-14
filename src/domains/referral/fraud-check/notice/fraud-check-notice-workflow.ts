import * as clock from "../../../../kit/clock.js";
import { FraudCheckNoticeEngine, defaultFraudCheckNoticeEngine } from "./fraud-check-notice-engine.js";
import { FraudCheckNoticeValidator, defaultFraudCheckNoticeValidator } from "./fraud-check-notice-rules.js";
import { FraudCheckNoticeStore } from "./fraud-check-notice-store.js";

/** Moves fraud check notices through their life cycle and keeps a journal of what it did. */
export class FraudCheckNoticeCoordinator {
  store: FraudCheckNoticeStore;
  validator: FraudCheckNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckNoticeEngine;

  constructor(
    store: FraudCheckNoticeStore,
    validator: FraudCheckNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckNoticeEngine,
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
      throw new Error(`fraud check notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check notice ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFraudCheckNoticeCoordinator(store: FraudCheckNoticeStore, clockValue: clock.Clock): FraudCheckNoticeCoordinator {
  return new FraudCheckNoticeCoordinator(
    store,
    defaultFraudCheckNoticeValidator(),
    clockValue,
    [],
    defaultFraudCheckNoticeEngine(),
  );
}
