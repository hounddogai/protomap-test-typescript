import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingFrequencyClaimEngine, defaultRollingFrequencyClaimEngine } from "./rolling-frequency-claim-engine.js";
import {
  RollingFrequencyClaimValidator,
  defaultRollingFrequencyClaimValidator,
} from "./rolling-frequency-claim-rules.js";
import { RollingFrequencyClaimStore } from "./rolling-frequency-claim-store.js";

/** Moves rolling frequency claims through their life cycle and keeps a journal of what it did. */
export class RollingFrequencyClaimManager {
  store: RollingFrequencyClaimStore;
  validator: RollingFrequencyClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingFrequencyClaimEngine;

  constructor(
    store: RollingFrequencyClaimStore,
    validator: RollingFrequencyClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingFrequencyClaimEngine,
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
      throw new Error(`rolling frequency claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling frequency claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling frequency claim ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRollingFrequencyClaimManager(store: RollingFrequencyClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingFrequencyClaimManager {
  return new RollingFrequencyClaimManager(
    store,
    defaultRollingFrequencyClaimValidator(),
    clockValue,
    [],
    defaultRollingFrequencyClaimEngine(flagsValue),
  );
}
