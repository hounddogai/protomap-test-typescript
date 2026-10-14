import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { QueueMetricEngine, defaultQueueMetricEngine } from "./queue-metric-engine.js";
import { QueueMetricValidator, defaultQueueMetricValidator } from "./queue-metric-rules.js";
import { QueueMetricStore } from "./queue-metric-store.js";

/** Moves queue metrics through their life cycle and keeps a journal of what it did. */
export class QueueMetricManager {
  store: QueueMetricStore;
  validator: QueueMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueMetricEngine;

  constructor(
    store: QueueMetricStore,
    validator: QueueMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueMetricEngine,
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
      throw new Error(`queue metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue metric ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newQueueMetricManager(store: QueueMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): QueueMetricManager {
  return new QueueMetricManager(
    store,
    defaultQueueMetricValidator(),
    clockValue,
    [],
    defaultQueueMetricEngine(flagsValue),
  );
}
