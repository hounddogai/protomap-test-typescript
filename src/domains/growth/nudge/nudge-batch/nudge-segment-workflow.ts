import * as clock from "../../../../kit/clock.js";
import { NudgeSegmentEngine, defaultNudgeSegmentEngine } from "./nudge-segment-engine.js";
import { NudgeSegmentValidator, defaultNudgeSegmentValidator } from "./nudge-segment-rules.js";
import { NudgeSegmentStore } from "./nudge-segment-store.js";

/** Moves nudge segments through their life cycle and keeps a journal of what it did. */
export class NudgeSegmentDesk {
  store: NudgeSegmentStore;
  validator: NudgeSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeSegmentEngine;

  constructor(
    store: NudgeSegmentStore,
    validator: NudgeSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeSegmentEngine,
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
      throw new Error(`nudge segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newNudgeSegmentDesk(store: NudgeSegmentStore, clockValue: clock.Clock): NudgeSegmentDesk {
  return new NudgeSegmentDesk(store, defaultNudgeSegmentValidator(), clockValue, [], defaultNudgeSegmentEngine());
}
