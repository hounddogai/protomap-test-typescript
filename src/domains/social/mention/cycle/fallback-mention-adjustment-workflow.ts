import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackMentionAdjustmentEngine,
  defaultFallbackMentionAdjustmentEngine,
} from "./fallback-mention-adjustment-engine.js";
import {
  FallbackMentionAdjustmentValidator,
  defaultFallbackMentionAdjustmentValidator,
} from "./fallback-mention-adjustment-rules.js";
import { FallbackMentionAdjustmentStore } from "./fallback-mention-adjustment-store.js";

/** Moves fallback mention adjustments through their life cycle and keeps a journal of what it did. */
export class FallbackMentionAdjustmentService {
  store: FallbackMentionAdjustmentStore;
  validator: FallbackMentionAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackMentionAdjustmentEngine;

  constructor(
    store: FallbackMentionAdjustmentStore,
    validator: FallbackMentionAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackMentionAdjustmentEngine,
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
      throw new Error(`fallback mention adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback mention adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback mention adjustment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFallbackMentionAdjustmentService(store: FallbackMentionAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackMentionAdjustmentService {
  return new FallbackMentionAdjustmentService(
    store,
    defaultFallbackMentionAdjustmentValidator(),
    clockValue,
    [],
    defaultFallbackMentionAdjustmentEngine(flagsValue),
  );
}
