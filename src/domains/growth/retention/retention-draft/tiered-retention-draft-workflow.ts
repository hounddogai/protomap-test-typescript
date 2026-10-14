import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredRetentionDraftEngine, defaultTieredRetentionDraftEngine } from "./tiered-retention-draft-engine.js";
import {
  TieredRetentionDraftValidator,
  defaultTieredRetentionDraftValidator,
} from "./tiered-retention-draft-rules.js";
import { TieredRetentionDraftStore } from "./tiered-retention-draft-store.js";

/** Moves tiered retention drafts through their life cycle and keeps a journal of what it did. */
export class TieredRetentionDraftCoordinator {
  store: TieredRetentionDraftStore;
  validator: TieredRetentionDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredRetentionDraftEngine;

  constructor(
    store: TieredRetentionDraftStore,
    validator: TieredRetentionDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredRetentionDraftEngine,
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
      throw new Error(`tiered retention draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered retention draft ${code} not found`);
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
      throw new Error(`tiered retention draft ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredRetentionDraftCoordinator(store: TieredRetentionDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredRetentionDraftCoordinator {
  return new TieredRetentionDraftCoordinator(
    store,
    defaultTieredRetentionDraftValidator(),
    clockValue,
    [],
    defaultTieredRetentionDraftEngine(flagsValue),
  );
}
