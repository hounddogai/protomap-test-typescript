import * as clock from "../../../../kit/clock.js";
import { ScheduledPathEstimateEngine, defaultScheduledPathEstimateEngine } from "./scheduled-path-estimate-engine.js";
import {
  ScheduledPathEstimateValidator,
  defaultScheduledPathEstimateValidator,
} from "./scheduled-path-estimate-rules.js";
import { ScheduledPathEstimateStore } from "./scheduled-path-estimate-store.js";

/** Moves scheduled path estimates through their life cycle and keeps a journal of what it did. */
export class ScheduledPathEstimateCoordinator {
  store: ScheduledPathEstimateStore;
  validator: ScheduledPathEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledPathEstimateEngine;

  constructor(
    store: ScheduledPathEstimateStore,
    validator: ScheduledPathEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledPathEstimateEngine,
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
      throw new Error(`scheduled path estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled path estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled path estimate ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newScheduledPathEstimateCoordinator(store: ScheduledPathEstimateStore, clockValue: clock.Clock): ScheduledPathEstimateCoordinator {
  return new ScheduledPathEstimateCoordinator(
    store,
    defaultScheduledPathEstimateValidator(),
    clockValue,
    [],
    defaultScheduledPathEstimateEngine(),
  );
}
