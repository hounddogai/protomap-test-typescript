import * as clock from "../../../../kit/clock.js";
import {
  SeasonalChallengeQuotaEngine,
  defaultSeasonalChallengeQuotaEngine,
} from "./seasonal-challenge-quota-engine.js";
import {
  SeasonalChallengeQuotaValidator,
  defaultSeasonalChallengeQuotaValidator,
} from "./seasonal-challenge-quota-rules.js";
import { SeasonalChallengeQuotaStore } from "./seasonal-challenge-quota-store.js";

/** Moves seasonal challenge quotas through their life cycle and keeps a journal of what it did. */
export class SeasonalChallengeQuotaDesk {
  store: SeasonalChallengeQuotaStore;
  validator: SeasonalChallengeQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalChallengeQuotaEngine;

  constructor(
    store: SeasonalChallengeQuotaStore,
    validator: SeasonalChallengeQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalChallengeQuotaEngine,
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
      throw new Error(`seasonal challenge quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal challenge quota ${code} not found`);
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
      throw new Error(`seasonal challenge quota ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSeasonalChallengeQuotaDesk(store: SeasonalChallengeQuotaStore, clockValue: clock.Clock): SeasonalChallengeQuotaDesk {
  return new SeasonalChallengeQuotaDesk(
    store,
    defaultSeasonalChallengeQuotaValidator(),
    clockValue,
    [],
    defaultSeasonalChallengeQuotaEngine(),
  );
}
