import * as clock from "../../../../kit/clock.js";
import { PrimaryReplyMetricEngine, defaultPrimaryReplyMetricEngine } from "./primary-reply-metric-engine.js";
import { PrimaryReplyMetricValidator, defaultPrimaryReplyMetricValidator } from "./primary-reply-metric-rules.js";
import { PrimaryReplyMetricStore } from "./primary-reply-metric-store.js";

/** Moves primary reply metrics through their life cycle and keeps a journal of what it did. */
export class PrimaryReplyMetricManager {
  store: PrimaryReplyMetricStore;
  validator: PrimaryReplyMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryReplyMetricEngine;

  constructor(
    store: PrimaryReplyMetricStore,
    validator: PrimaryReplyMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryReplyMetricEngine,
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
      throw new Error(`primary reply metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reply metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reply metric ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryReplyMetricManager(store: PrimaryReplyMetricStore, clockValue: clock.Clock): PrimaryReplyMetricManager {
  return new PrimaryReplyMetricManager(
    store,
    defaultPrimaryReplyMetricValidator(),
    clockValue,
    [],
    defaultPrimaryReplyMetricEngine(),
  );
}
