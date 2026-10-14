import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackCreditTargetEngine, defaultFallbackCreditTargetEngine } from "./fallback-credit-target-engine.js";
import {
  FallbackCreditTargetValidator,
  defaultFallbackCreditTargetValidator,
} from "./fallback-credit-target-rules.js";
import { FallbackCreditTargetStore } from "./fallback-credit-target-store.js";

/** Moves fallback credit targets through their life cycle and keeps a journal of what it did. */
export class FallbackCreditTargetCoordinator {
  store: FallbackCreditTargetStore;
  validator: FallbackCreditTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackCreditTargetEngine;

  constructor(
    store: FallbackCreditTargetStore,
    validator: FallbackCreditTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackCreditTargetEngine,
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
      throw new Error(`fallback credit target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback credit target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback credit target ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackCreditTargetCoordinator(store: FallbackCreditTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackCreditTargetCoordinator {
  return new FallbackCreditTargetCoordinator(
    store,
    defaultFallbackCreditTargetValidator(),
    clockValue,
    [],
    defaultFallbackCreditTargetEngine(flagsValue),
  );
}
