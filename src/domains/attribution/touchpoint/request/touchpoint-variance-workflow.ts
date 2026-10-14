import * as clock from "../../../../kit/clock.js";
import { TouchpointVarianceEngine, defaultTouchpointVarianceEngine } from "./touchpoint-variance-engine.js";
import { TouchpointVarianceValidator, defaultTouchpointVarianceValidator } from "./touchpoint-variance-rules.js";
import { TouchpointVarianceStore } from "./touchpoint-variance-store.js";

/** Moves touchpoint variances through their life cycle and keeps a journal of what it did. */
export class TouchpointVarianceManager {
  store: TouchpointVarianceStore;
  validator: TouchpointVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointVarianceEngine;

  constructor(
    store: TouchpointVarianceStore,
    validator: TouchpointVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointVarianceEngine,
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
      throw new Error(`touchpoint variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint variance ${code} not found`);
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
      throw new Error(`touchpoint variance ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTouchpointVarianceManager(store: TouchpointVarianceStore, clockValue: clock.Clock): TouchpointVarianceManager {
  return new TouchpointVarianceManager(
    store,
    defaultTouchpointVarianceValidator(),
    clockValue,
    [],
    defaultTouchpointVarianceEngine(),
  );
}
