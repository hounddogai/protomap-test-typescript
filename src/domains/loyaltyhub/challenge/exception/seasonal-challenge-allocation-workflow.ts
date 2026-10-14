import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalChallengeAllocationEngine,
  defaultSeasonalChallengeAllocationEngine,
} from "./seasonal-challenge-allocation-engine.js";
import {
  SeasonalChallengeAllocationValidator,
  defaultSeasonalChallengeAllocationValidator,
} from "./seasonal-challenge-allocation-rules.js";
import { SeasonalChallengeAllocationStore } from "./seasonal-challenge-allocation-store.js";

/** Moves seasonal challenge allocations through their life cycle and keeps a journal of what it did. */
export class SeasonalChallengeAllocationWorkflow {
  store: SeasonalChallengeAllocationStore;
  validator: SeasonalChallengeAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalChallengeAllocationEngine;

  constructor(
    store: SeasonalChallengeAllocationStore,
    validator: SeasonalChallengeAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalChallengeAllocationEngine,
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
      throw new Error(`seasonal challenge allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal challenge allocation ${code} not found`);
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
      throw new Error(`seasonal challenge allocation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSeasonalChallengeAllocationWorkflow(store: SeasonalChallengeAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalChallengeAllocationWorkflow {
  return new SeasonalChallengeAllocationWorkflow(
    store,
    defaultSeasonalChallengeAllocationValidator(),
    clockValue,
    [],
    defaultSeasonalChallengeAllocationEngine(flagsValue),
  );
}
