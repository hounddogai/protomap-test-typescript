import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeSummaryEngine, defaultChallengeSummaryEngine } from "./challenge-summary-engine.js";
import { ChallengeSummaryValidator, defaultChallengeSummaryValidator } from "./challenge-summary-rules.js";
import { ChallengeSummaryStore } from "./challenge-summary-store.js";

/** Moves challenge summaries through their life cycle and keeps a journal of what it did. */
export class ChallengeSummaryCoordinator {
  store: ChallengeSummaryStore;
  validator: ChallengeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeSummaryEngine;

  constructor(
    store: ChallengeSummaryStore,
    validator: ChallengeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeSummaryEngine,
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
      throw new Error(`challenge summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge summary ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newChallengeSummaryCoordinator(store: ChallengeSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeSummaryCoordinator {
  return new ChallengeSummaryCoordinator(
    store,
    defaultChallengeSummaryValidator(),
    clockValue,
    [],
    defaultChallengeSummaryEngine(flagsValue),
  );
}
