import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingConversionNoticeEngine,
  defaultPendingConversionNoticeEngine,
} from "./pending-conversion-notice-engine.js";
import {
  PendingConversionNoticeValidator,
  defaultPendingConversionNoticeValidator,
} from "./pending-conversion-notice-rules.js";
import { PendingConversionNoticeStore } from "./pending-conversion-notice-store.js";

/** Moves pending conversion notices through their life cycle and keeps a journal of what it did. */
export class PendingConversionNoticeManager {
  store: PendingConversionNoticeStore;
  validator: PendingConversionNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingConversionNoticeEngine;

  constructor(
    store: PendingConversionNoticeStore,
    validator: PendingConversionNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingConversionNoticeEngine,
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
      throw new Error(`pending conversion notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending conversion notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending conversion notice ${code} not found`);
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

export function newPendingConversionNoticeManager(store: PendingConversionNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingConversionNoticeManager {
  return new PendingConversionNoticeManager(
    store,
    defaultPendingConversionNoticeValidator(),
    clockValue,
    [],
    defaultPendingConversionNoticeEngine(flagsValue),
  );
}
