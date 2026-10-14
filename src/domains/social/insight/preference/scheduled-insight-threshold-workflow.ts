import * as clock from "../../../../kit/clock.js";
import {
  ScheduledInsightThresholdEngine,
  defaultScheduledInsightThresholdEngine,
} from "./scheduled-insight-threshold-engine.js";
import {
  ScheduledInsightThresholdValidator,
  defaultScheduledInsightThresholdValidator,
} from "./scheduled-insight-threshold-rules.js";
import { ScheduledInsightThresholdStore } from "./scheduled-insight-threshold-store.js";

/** Moves scheduled insight thresholds through their life cycle and keeps a journal of what it did. */
export class ScheduledInsightThresholdManager {
  store: ScheduledInsightThresholdStore;
  validator: ScheduledInsightThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledInsightThresholdEngine;

  constructor(
    store: ScheduledInsightThresholdStore,
    validator: ScheduledInsightThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledInsightThresholdEngine,
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
      throw new Error(`scheduled insight threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled insight threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled insight threshold ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newScheduledInsightThresholdManager(store: ScheduledInsightThresholdStore, clockValue: clock.Clock): ScheduledInsightThresholdManager {
  return new ScheduledInsightThresholdManager(
    store,
    defaultScheduledInsightThresholdValidator(),
    clockValue,
    [],
    defaultScheduledInsightThresholdEngine(),
  );
}
