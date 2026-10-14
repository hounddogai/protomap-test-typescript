import * as clock from "../../../../kit/clock.js";
import { GlobalCreativeSummaryEngine, defaultGlobalCreativeSummaryEngine } from "./global-creative-summary-engine.js";
import {
  GlobalCreativeSummaryValidator,
  defaultGlobalCreativeSummaryValidator,
} from "./global-creative-summary-rules.js";
import { GlobalCreativeSummaryStore } from "./global-creative-summary-store.js";

/** Moves global creative summaries through their life cycle and keeps a journal of what it did. */
export class GlobalCreativeSummaryManager {
  store: GlobalCreativeSummaryStore;
  validator: GlobalCreativeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalCreativeSummaryEngine;

  constructor(
    store: GlobalCreativeSummaryStore,
    validator: GlobalCreativeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalCreativeSummaryEngine,
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
      throw new Error(`global creative summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global creative summary ${code} not found`);
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
      throw new Error(`global creative summary ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newGlobalCreativeSummaryManager(store: GlobalCreativeSummaryStore, clockValue: clock.Clock): GlobalCreativeSummaryManager {
  return new GlobalCreativeSummaryManager(
    store,
    defaultGlobalCreativeSummaryValidator(),
    clockValue,
    [],
    defaultGlobalCreativeSummaryEngine(),
  );
}
