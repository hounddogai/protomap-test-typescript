import * as clock from "../../../../kit/clock.js";
import { WaitMetricEngine, defaultWaitMetricEngine } from "./wait-metric-engine.js";
import { WaitMetricValidator, defaultWaitMetricValidator } from "./wait-metric-rules.js";
import { WaitMetricStore } from "./wait-metric-store.js";

/** Moves wait metrics through their life cycle and keeps a journal of what it did. */
export class WaitMetricService {
  store: WaitMetricStore;
  validator: WaitMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitMetricEngine;

  constructor(
    store: WaitMetricStore,
    validator: WaitMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitMetricEngine,
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
      throw new Error(`wait metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait metric ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWaitMetricService(store: WaitMetricStore, clockValue: clock.Clock): WaitMetricService {
  return new WaitMetricService(store, defaultWaitMetricValidator(), clockValue, [], defaultWaitMetricEngine());
}
