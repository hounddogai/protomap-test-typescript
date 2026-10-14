import * as clock from "../../../../kit/clock.js";
import { LenientSlaReviewEngine, defaultLenientSlaReviewEngine } from "./lenient-sla-review-engine.js";
import { LenientSlaReviewValidator, defaultLenientSlaReviewValidator } from "./lenient-sla-review-rules.js";
import { LenientSlaReviewStore } from "./lenient-sla-review-store.js";

/** Moves lenient sla reviews through their life cycle and keeps a journal of what it did. */
export class LenientSlaReviewManager {
  store: LenientSlaReviewStore;
  validator: LenientSlaReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientSlaReviewEngine;

  constructor(
    store: LenientSlaReviewStore,
    validator: LenientSlaReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientSlaReviewEngine,
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
      throw new Error(`lenient sla review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient sla review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient sla review ${code} not found`);
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

export function newLenientSlaReviewManager(store: LenientSlaReviewStore, clockValue: clock.Clock): LenientSlaReviewManager {
  return new LenientSlaReviewManager(
    store,
    defaultLenientSlaReviewValidator(),
    clockValue,
    [],
    defaultLenientSlaReviewEngine(),
  );
}
