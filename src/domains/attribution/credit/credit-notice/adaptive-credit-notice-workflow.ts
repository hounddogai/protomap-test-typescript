import * as clock from "../../../../kit/clock.js";
import { AdaptiveCreditNoticeEngine, defaultAdaptiveCreditNoticeEngine } from "./adaptive-credit-notice-engine.js";
import {
  AdaptiveCreditNoticeValidator,
  defaultAdaptiveCreditNoticeValidator,
} from "./adaptive-credit-notice-rules.js";
import { AdaptiveCreditNoticeStore } from "./adaptive-credit-notice-store.js";

/** Moves adaptive credit notices through their life cycle and keeps a journal of what it did. */
export class AdaptiveCreditNoticeService {
  store: AdaptiveCreditNoticeStore;
  validator: AdaptiveCreditNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveCreditNoticeEngine;

  constructor(
    store: AdaptiveCreditNoticeStore,
    validator: AdaptiveCreditNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveCreditNoticeEngine,
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
      throw new Error(`adaptive credit notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive credit notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive credit notice ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newAdaptiveCreditNoticeService(store: AdaptiveCreditNoticeStore, clockValue: clock.Clock): AdaptiveCreditNoticeService {
  return new AdaptiveCreditNoticeService(
    store,
    defaultAdaptiveCreditNoticeValidator(),
    clockValue,
    [],
    defaultAdaptiveCreditNoticeEngine(),
  );
}
