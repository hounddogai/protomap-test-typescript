import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveRedemptionSummaryEngine,
  defaultAdaptiveRedemptionSummaryEngine,
} from "./adaptive-redemption-summary-engine.js";
import {
  AdaptiveRedemptionSummaryValidator,
  defaultAdaptiveRedemptionSummaryValidator,
} from "./adaptive-redemption-summary-rules.js";
import { AdaptiveRedemptionSummaryStore } from "./adaptive-redemption-summary-store.js";

/** Moves adaptive redemption summaries through their life cycle and keeps a journal of what it did. */
export class AdaptiveRedemptionSummaryService {
  store: AdaptiveRedemptionSummaryStore;
  validator: AdaptiveRedemptionSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveRedemptionSummaryEngine;

  constructor(
    store: AdaptiveRedemptionSummaryStore,
    validator: AdaptiveRedemptionSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveRedemptionSummaryEngine,
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
      throw new Error(`adaptive redemption summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive redemption summary ${code} not found`);
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
      throw new Error(`adaptive redemption summary ${code} not found`);
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

export function newAdaptiveRedemptionSummaryService(store: AdaptiveRedemptionSummaryStore, clockValue: clock.Clock): AdaptiveRedemptionSummaryService {
  return new AdaptiveRedemptionSummaryService(
    store,
    defaultAdaptiveRedemptionSummaryValidator(),
    clockValue,
    [],
    defaultAdaptiveRedemptionSummaryEngine(),
  );
}
