import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SeasonalProofClaimEngine, defaultSeasonalProofClaimEngine } from "./seasonal-proof-claim-engine.js";
import { SeasonalProofClaimValidator, defaultSeasonalProofClaimValidator } from "./seasonal-proof-claim-rules.js";
import { SeasonalProofClaimStore } from "./seasonal-proof-claim-store.js";

/** Moves seasonal proof claims through their life cycle and keeps a journal of what it did. */
export class SeasonalProofClaimManager {
  store: SeasonalProofClaimStore;
  validator: SeasonalProofClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalProofClaimEngine;

  constructor(
    store: SeasonalProofClaimStore,
    validator: SeasonalProofClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalProofClaimEngine,
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
      throw new Error(`seasonal proof claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal proof claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal proof claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSeasonalProofClaimManager(store: SeasonalProofClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalProofClaimManager {
  return new SeasonalProofClaimManager(
    store,
    defaultSeasonalProofClaimValidator(),
    clockValue,
    [],
    defaultSeasonalProofClaimEngine(flagsValue),
  );
}
