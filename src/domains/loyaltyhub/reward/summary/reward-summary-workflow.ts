import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardSummaryEngine, defaultRewardSummaryEngine } from "./reward-summary-engine.js";
import { RewardSummaryValidator, defaultRewardSummaryValidator } from "./reward-summary-rules.js";
import { RewardSummaryStore } from "./reward-summary-store.js";

/** Moves reward summaries through their life cycle and keeps a journal of what it did. */
export class RewardSummaryCoordinator {
  store: RewardSummaryStore;
  validator: RewardSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardSummaryEngine;

  constructor(
    store: RewardSummaryStore,
    validator: RewardSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardSummaryEngine,
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
      throw new Error(`reward summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward summary ${code} not found`);
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

export function newRewardSummaryCoordinator(store: RewardSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardSummaryCoordinator {
  return new RewardSummaryCoordinator(
    store,
    defaultRewardSummaryValidator(),
    clockValue,
    [],
    defaultRewardSummaryEngine(flagsValue),
  );
}
