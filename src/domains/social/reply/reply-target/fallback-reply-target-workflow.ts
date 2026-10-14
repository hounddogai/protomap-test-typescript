import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackReplyTargetEngine, defaultFallbackReplyTargetEngine } from "./fallback-reply-target-engine.js";
import { FallbackReplyTargetValidator, defaultFallbackReplyTargetValidator } from "./fallback-reply-target-rules.js";
import { FallbackReplyTargetStore } from "./fallback-reply-target-store.js";

/** Moves fallback reply targets through their life cycle and keeps a journal of what it did. */
export class FallbackReplyTargetCoordinator {
  store: FallbackReplyTargetStore;
  validator: FallbackReplyTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackReplyTargetEngine;

  constructor(
    store: FallbackReplyTargetStore,
    validator: FallbackReplyTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackReplyTargetEngine,
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
      throw new Error(`fallback reply target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reply target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reply target ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFallbackReplyTargetCoordinator(store: FallbackReplyTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackReplyTargetCoordinator {
  return new FallbackReplyTargetCoordinator(
    store,
    defaultFallbackReplyTargetValidator(),
    clockValue,
    [],
    defaultFallbackReplyTargetEngine(flagsValue),
  );
}
