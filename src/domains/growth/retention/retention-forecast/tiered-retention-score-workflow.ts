import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredRetentionScoreEngine, defaultTieredRetentionScoreEngine } from "./tiered-retention-score-engine.js";
import {
  TieredRetentionScoreValidator,
  defaultTieredRetentionScoreValidator,
} from "./tiered-retention-score-rules.js";
import { TieredRetentionScoreStore } from "./tiered-retention-score-store.js";

/** Moves tiered retention scores through their life cycle and keeps a journal of what it did. */
export class TieredRetentionScoreService {
  store: TieredRetentionScoreStore;
  validator: TieredRetentionScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredRetentionScoreEngine;

  constructor(
    store: TieredRetentionScoreStore,
    validator: TieredRetentionScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredRetentionScoreEngine,
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
      throw new Error(`tiered retention score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered retention score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered retention score ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredRetentionScoreService(store: TieredRetentionScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredRetentionScoreService {
  return new TieredRetentionScoreService(
    store,
    defaultTieredRetentionScoreValidator(),
    clockValue,
    [],
    defaultTieredRetentionScoreEngine(flagsValue),
  );
}
