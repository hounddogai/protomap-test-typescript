import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientRewardProfileEngine, defaultLenientRewardProfileEngine } from "./lenient-reward-profile-engine.js";
import {
  LenientRewardProfileValidator,
  defaultLenientRewardProfileValidator,
} from "./lenient-reward-profile-rules.js";
import { LenientRewardProfileStore } from "./lenient-reward-profile-store.js";

/** Moves lenient reward profiles through their life cycle and keeps a journal of what it did. */
export class LenientRewardProfileService {
  store: LenientRewardProfileStore;
  validator: LenientRewardProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientRewardProfileEngine;

  constructor(
    store: LenientRewardProfileStore,
    validator: LenientRewardProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientRewardProfileEngine,
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
      throw new Error(`lenient reward profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward profile ${code} not found`);
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
      throw new Error(`lenient reward profile ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientRewardProfileService(store: LenientRewardProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientRewardProfileService {
  return new LenientRewardProfileService(
    store,
    defaultLenientRewardProfileValidator(),
    clockValue,
    [],
    defaultLenientRewardProfileEngine(flagsValue),
  );
}
