import * as clock from "../../../../kit/clock.js";
import { LenientReplyMetricEngine, defaultLenientReplyMetricEngine } from "./lenient-reply-metric-engine.js";
import { LenientReplyMetricValidator, defaultLenientReplyMetricValidator } from "./lenient-reply-metric-rules.js";
import { LenientReplyMetricStore } from "./lenient-reply-metric-store.js";

/** Moves lenient reply metrics through their life cycle and keeps a journal of what it did. */
export class LenientReplyMetricDesk {
  store: LenientReplyMetricStore;
  validator: LenientReplyMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientReplyMetricEngine;

  constructor(
    store: LenientReplyMetricStore,
    validator: LenientReplyMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientReplyMetricEngine,
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
      throw new Error(`lenient reply metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reply metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reply metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLenientReplyMetricDesk(store: LenientReplyMetricStore, clockValue: clock.Clock): LenientReplyMetricDesk {
  return new LenientReplyMetricDesk(
    store,
    defaultLenientReplyMetricValidator(),
    clockValue,
    [],
    defaultLenientReplyMetricEngine(),
  );
}
