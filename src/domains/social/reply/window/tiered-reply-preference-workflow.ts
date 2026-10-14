import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredReplyPreferenceEngine, defaultTieredReplyPreferenceEngine } from "./tiered-reply-preference-engine.js";
import {
  TieredReplyPreferenceValidator,
  defaultTieredReplyPreferenceValidator,
} from "./tiered-reply-preference-rules.js";
import { TieredReplyPreferenceStore } from "./tiered-reply-preference-store.js";

/** Moves tiered reply preferences through their life cycle and keeps a journal of what it did. */
export class TieredReplyPreferenceService {
  store: TieredReplyPreferenceStore;
  validator: TieredReplyPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredReplyPreferenceEngine;

  constructor(
    store: TieredReplyPreferenceStore,
    validator: TieredReplyPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredReplyPreferenceEngine,
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
      throw new Error(`tiered reply preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reply preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reply preference ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newTieredReplyPreferenceService(store: TieredReplyPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredReplyPreferenceService {
  return new TieredReplyPreferenceService(
    store,
    defaultTieredReplyPreferenceValidator(),
    clockValue,
    [],
    defaultTieredReplyPreferenceEngine(flagsValue),
  );
}
