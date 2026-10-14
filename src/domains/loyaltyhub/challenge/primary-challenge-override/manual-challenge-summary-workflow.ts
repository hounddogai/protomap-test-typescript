import * as clock from "../../../../kit/clock.js";
import {
  ManualChallengeSummaryEngine,
  defaultManualChallengeSummaryEngine,
} from "./manual-challenge-summary-engine.js";
import {
  ManualChallengeSummaryValidator,
  defaultManualChallengeSummaryValidator,
} from "./manual-challenge-summary-rules.js";
import { ManualChallengeSummaryStore } from "./manual-challenge-summary-store.js";

/** Moves manual challenge summaries through their life cycle and keeps a journal of what it did. */
export class ManualChallengeSummaryDesk {
  store: ManualChallengeSummaryStore;
  validator: ManualChallengeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualChallengeSummaryEngine;

  constructor(
    store: ManualChallengeSummaryStore,
    validator: ManualChallengeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualChallengeSummaryEngine,
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
      throw new Error(`manual challenge summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual challenge summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual challenge summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newManualChallengeSummaryDesk(store: ManualChallengeSummaryStore, clockValue: clock.Clock): ManualChallengeSummaryDesk {
  return new ManualChallengeSummaryDesk(
    store,
    defaultManualChallengeSummaryValidator(),
    clockValue,
    [],
    defaultManualChallengeSummaryEngine(),
  );
}
