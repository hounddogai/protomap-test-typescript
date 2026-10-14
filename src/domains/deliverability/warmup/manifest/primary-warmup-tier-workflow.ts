import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryWarmupTierEngine, defaultPrimaryWarmupTierEngine } from "./primary-warmup-tier-engine.js";
import { PrimaryWarmupTierValidator, defaultPrimaryWarmupTierValidator } from "./primary-warmup-tier-rules.js";
import { PrimaryWarmupTierStore } from "./primary-warmup-tier-store.js";

/** Moves primary warmup tiers through their life cycle and keeps a journal of what it did. */
export class PrimaryWarmupTierWorkflow {
  store: PrimaryWarmupTierStore;
  validator: PrimaryWarmupTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryWarmupTierEngine;

  constructor(
    store: PrimaryWarmupTierStore,
    validator: PrimaryWarmupTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryWarmupTierEngine,
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
      throw new Error(`primary warmup tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary warmup tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary warmup tier ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPrimaryWarmupTierWorkflow(store: PrimaryWarmupTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryWarmupTierWorkflow {
  return new PrimaryWarmupTierWorkflow(
    store,
    defaultPrimaryWarmupTierValidator(),
    clockValue,
    [],
    defaultPrimaryWarmupTierEngine(flagsValue),
  );
}
