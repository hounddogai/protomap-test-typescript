import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RedemptionSegmentEngine, defaultRedemptionSegmentEngine } from "./redemption-segment-engine.js";
import { RedemptionSegmentValidator, defaultRedemptionSegmentValidator } from "./redemption-segment-rules.js";
import { RedemptionSegmentStore } from "./redemption-segment-store.js";

/** Moves redemption segments through their life cycle and keeps a journal of what it did. */
export class RedemptionSegmentService {
  store: RedemptionSegmentStore;
  validator: RedemptionSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionSegmentEngine;

  constructor(
    store: RedemptionSegmentStore,
    validator: RedemptionSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionSegmentEngine,
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
      throw new Error(`redemption segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRedemptionSegmentService(store: RedemptionSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): RedemptionSegmentService {
  return new RedemptionSegmentService(
    store,
    defaultRedemptionSegmentValidator(),
    clockValue,
    [],
    defaultRedemptionSegmentEngine(flagsValue),
  );
}
