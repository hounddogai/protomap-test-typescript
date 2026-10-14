import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BounceProfileEngine, defaultBounceProfileEngine } from "./bounce-profile-engine.js";
import { BounceProfileValidator, defaultBounceProfileValidator } from "./bounce-profile-rules.js";
import { BounceProfileStore } from "./bounce-profile-store.js";

/** Moves bounce profiles through their life cycle and keeps a journal of what it did. */
export class BounceProfileDesk {
  store: BounceProfileStore;
  validator: BounceProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceProfileEngine;

  constructor(
    store: BounceProfileStore,
    validator: BounceProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceProfileEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce profile ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newBounceProfileDesk(store: BounceProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): BounceProfileDesk {
  return new BounceProfileDesk(
    store,
    defaultBounceProfileValidator(),
    clockValue,
    [],
    defaultBounceProfileEngine(flagsValue),
  );
}
