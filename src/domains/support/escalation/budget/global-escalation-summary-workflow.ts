import * as clock from "../../../../kit/clock.js";
import {
  GlobalEscalationSummaryEngine,
  defaultGlobalEscalationSummaryEngine,
} from "./global-escalation-summary-engine.js";
import {
  GlobalEscalationSummaryValidator,
  defaultGlobalEscalationSummaryValidator,
} from "./global-escalation-summary-rules.js";
import { GlobalEscalationSummaryStore } from "./global-escalation-summary-store.js";

/** Moves global escalation summaries through their life cycle and keeps a journal of what it did. */
export class GlobalEscalationSummaryCoordinator {
  store: GlobalEscalationSummaryStore;
  validator: GlobalEscalationSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalEscalationSummaryEngine;

  constructor(
    store: GlobalEscalationSummaryStore,
    validator: GlobalEscalationSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalEscalationSummaryEngine,
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
      throw new Error(`global escalation summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global escalation summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global escalation summary ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newGlobalEscalationSummaryCoordinator(store: GlobalEscalationSummaryStore, clockValue: clock.Clock): GlobalEscalationSummaryCoordinator {
  return new GlobalEscalationSummaryCoordinator(
    store,
    defaultGlobalEscalationSummaryValidator(),
    clockValue,
    [],
    defaultGlobalEscalationSummaryEngine(),
  );
}
