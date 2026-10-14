import * as clock from "../../../../kit/clock.js";
import {
  SeasonalRewardRollupValidator,
  defaultSeasonalRewardRollupValidator,
} from "./seasonal-reward-rollup-rules.js";
import { SeasonalRewardRollupStore } from "./seasonal-reward-rollup-store.js";

/** Moves seasonal reward rollups through their life cycle and keeps a journal of what it did. */
export class SeasonalRewardRollupWorkflow {
  store: SeasonalRewardRollupStore;
  validator: SeasonalRewardRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalRewardRollupStore,
    validator: SeasonalRewardRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reward rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reward rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalRewardRollupWorkflow(store: SeasonalRewardRollupStore, clockValue: clock.Clock): SeasonalRewardRollupWorkflow {
  return new SeasonalRewardRollupWorkflow(store, defaultSeasonalRewardRollupValidator(), clockValue, []);
}
