import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedTouchpointSummaryEngine,
  defaultCappedTouchpointSummaryEngine,
} from "./capped-touchpoint-summary-engine.js";
import {
  CappedTouchpointSummaryValidator,
  defaultCappedTouchpointSummaryValidator,
} from "./capped-touchpoint-summary-rules.js";
import { CappedTouchpointSummaryStore } from "./capped-touchpoint-summary-store.js";

/** Moves capped touchpoint summaries through their life cycle and keeps a journal of what it did. */
export class CappedTouchpointSummaryCoordinator {
  store: CappedTouchpointSummaryStore;
  validator: CappedTouchpointSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedTouchpointSummaryEngine;

  constructor(
    store: CappedTouchpointSummaryStore,
    validator: CappedTouchpointSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedTouchpointSummaryEngine,
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
      throw new Error(`capped touchpoint summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped touchpoint summary ${code} not found`);
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
      throw new Error(`capped touchpoint summary ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCappedTouchpointSummaryCoordinator(store: CappedTouchpointSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedTouchpointSummaryCoordinator {
  return new CappedTouchpointSummaryCoordinator(
    store,
    defaultCappedTouchpointSummaryValidator(),
    clockValue,
    [],
    defaultCappedTouchpointSummaryEngine(flagsValue),
  );
}
