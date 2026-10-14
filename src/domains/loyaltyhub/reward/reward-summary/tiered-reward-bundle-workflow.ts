import * as clock from "../../../../kit/clock.js";
import { TieredRewardBundleEngine, defaultTieredRewardBundleEngine } from "./tiered-reward-bundle-engine.js";
import { TieredRewardBundleValidator, defaultTieredRewardBundleValidator } from "./tiered-reward-bundle-rules.js";
import { TieredRewardBundleStore } from "./tiered-reward-bundle-store.js";

/** Moves tiered reward bundles through their life cycle and keeps a journal of what it did. */
export class TieredRewardBundleService {
  store: TieredRewardBundleStore;
  validator: TieredRewardBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredRewardBundleEngine;

  constructor(
    store: TieredRewardBundleStore,
    validator: TieredRewardBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredRewardBundleEngine,
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
      throw new Error(`tiered reward bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredRewardBundleService(store: TieredRewardBundleStore, clockValue: clock.Clock): TieredRewardBundleService {
  return new TieredRewardBundleService(
    store,
    defaultTieredRewardBundleValidator(),
    clockValue,
    [],
    defaultTieredRewardBundleEngine(),
  );
}
