import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackSenderRollupEngine, defaultFallbackSenderRollupEngine } from "./fallback-sender-rollup-engine.js";
import {
  FallbackSenderRollupValidator,
  defaultFallbackSenderRollupValidator,
} from "./fallback-sender-rollup-rules.js";
import { FallbackSenderRollupStore } from "./fallback-sender-rollup-store.js";

/** Moves fallback sender rollups through their life cycle and keeps a journal of what it did. */
export class FallbackSenderRollupService {
  store: FallbackSenderRollupStore;
  validator: FallbackSenderRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackSenderRollupEngine;

  constructor(
    store: FallbackSenderRollupStore,
    validator: FallbackSenderRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackSenderRollupEngine,
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
      throw new Error(`fallback sender rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback sender rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback sender rollup ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFallbackSenderRollupService(store: FallbackSenderRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackSenderRollupService {
  return new FallbackSenderRollupService(
    store,
    defaultFallbackSenderRollupValidator(),
    clockValue,
    [],
    defaultFallbackSenderRollupEngine(flagsValue),
  );
}
