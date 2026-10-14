import * as clock from "../../../../kit/clock.js";
import {
  TieredConversionNoticeEngine,
  defaultTieredConversionNoticeEngine,
} from "./tiered-conversion-notice-engine.js";
import {
  TieredConversionNoticeValidator,
  defaultTieredConversionNoticeValidator,
} from "./tiered-conversion-notice-rules.js";
import { TieredConversionNoticeStore } from "./tiered-conversion-notice-store.js";

/** Moves tiered conversion notices through their life cycle and keeps a journal of what it did. */
export class TieredConversionNoticeService {
  store: TieredConversionNoticeStore;
  validator: TieredConversionNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredConversionNoticeEngine;

  constructor(
    store: TieredConversionNoticeStore,
    validator: TieredConversionNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredConversionNoticeEngine,
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
      throw new Error(`tiered conversion notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered conversion notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered conversion notice ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newTieredConversionNoticeService(store: TieredConversionNoticeStore, clockValue: clock.Clock): TieredConversionNoticeService {
  return new TieredConversionNoticeService(
    store,
    defaultTieredConversionNoticeValidator(),
    clockValue,
    [],
    defaultTieredConversionNoticeEngine(),
  );
}
