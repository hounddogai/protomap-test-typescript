import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TouchpointMetricEngine, defaultTouchpointMetricEngine } from "./touchpoint-metric-engine.js";
import { TouchpointMetricValidator, defaultTouchpointMetricValidator } from "./touchpoint-metric-rules.js";
import { TouchpointMetricStore } from "./touchpoint-metric-store.js";

/** Moves touchpoint metrics through their life cycle and keeps a journal of what it did. */
export class TouchpointMetricService {
  store: TouchpointMetricStore;
  validator: TouchpointMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointMetricEngine;

  constructor(
    store: TouchpointMetricStore,
    validator: TouchpointMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointMetricEngine,
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
      throw new Error(`touchpoint metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint metric ${code} not found`);
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
      throw new Error(`touchpoint metric ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newTouchpointMetricService(store: TouchpointMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): TouchpointMetricService {
  return new TouchpointMetricService(
    store,
    defaultTouchpointMetricValidator(),
    clockValue,
    [],
    defaultTouchpointMetricEngine(flagsValue),
  );
}
