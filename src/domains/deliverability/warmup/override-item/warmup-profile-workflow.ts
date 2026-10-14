import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WarmupProfileEngine, defaultWarmupProfileEngine } from "./warmup-profile-engine.js";
import { WarmupProfileValidator, defaultWarmupProfileValidator } from "./warmup-profile-rules.js";
import { WarmupProfileStore } from "./warmup-profile-store.js";

/** Moves warmup profiles through their life cycle and keeps a journal of what it did. */
export class WarmupProfileCoordinator {
  store: WarmupProfileStore;
  validator: WarmupProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupProfileEngine;

  constructor(
    store: WarmupProfileStore,
    validator: WarmupProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupProfileEngine,
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
      throw new Error(`warmup profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup profile ${code} not found`);
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
      throw new Error(`warmup profile ${code} not found`);
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

export function newWarmupProfileCoordinator(store: WarmupProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): WarmupProfileCoordinator {
  return new WarmupProfileCoordinator(
    store,
    defaultWarmupProfileValidator(),
    clockValue,
    [],
    defaultWarmupProfileEngine(flagsValue),
  );
}
