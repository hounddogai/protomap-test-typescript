import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredTouchpointSummaryEngine,
  defaultTieredTouchpointSummaryEngine,
} from "./tiered-touchpoint-summary-engine.js";
import {
  TieredTouchpointSummaryValidator,
  defaultTieredTouchpointSummaryValidator,
} from "./tiered-touchpoint-summary-rules.js";
import { TieredTouchpointSummaryStore } from "./tiered-touchpoint-summary-store.js";

/** Moves tiered touchpoint summaries through their life cycle and keeps a journal of what it did. */
export class TieredTouchpointSummaryManager {
  store: TieredTouchpointSummaryStore;
  validator: TieredTouchpointSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTouchpointSummaryEngine;

  constructor(
    store: TieredTouchpointSummaryStore,
    validator: TieredTouchpointSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTouchpointSummaryEngine,
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
      throw new Error(`tiered touchpoint summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered touchpoint summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered touchpoint summary ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredTouchpointSummaryManager(store: TieredTouchpointSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredTouchpointSummaryManager {
  return new TieredTouchpointSummaryManager(
    store,
    defaultTieredTouchpointSummaryValidator(),
    clockValue,
    [],
    defaultTieredTouchpointSummaryEngine(flagsValue),
  );
}
