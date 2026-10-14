import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { QueueForecastEngine, defaultQueueForecastEngine } from "./queue-forecast-engine.js";
import { QueueForecastValidator, defaultQueueForecastValidator } from "./queue-forecast-rules.js";
import { QueueForecastStore } from "./queue-forecast-store.js";

/** Moves queue forecasts through their life cycle and keeps a journal of what it did. */
export class QueueForecastCoordinator {
  store: QueueForecastStore;
  validator: QueueForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueForecastEngine;

  constructor(
    store: QueueForecastStore,
    validator: QueueForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueForecastEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue forecast ${code} not found`);
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
      throw new Error(`queue forecast ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newQueueForecastCoordinator(store: QueueForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): QueueForecastCoordinator {
  return new QueueForecastCoordinator(
    store,
    defaultQueueForecastValidator(),
    clockValue,
    [],
    defaultQueueForecastEngine(flagsValue),
  );
}
