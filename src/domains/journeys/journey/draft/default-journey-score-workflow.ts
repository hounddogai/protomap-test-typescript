import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultJourneyScoreEngine, defaultDefaultJourneyScoreEngine } from "./default-journey-score-engine.js";
import { DefaultJourneyScoreValidator, defaultDefaultJourneyScoreValidator } from "./default-journey-score-rules.js";
import { DefaultJourneyScoreStore } from "./default-journey-score-store.js";

/** Moves default journey scores through their life cycle and keeps a journal of what it did. */
export class DefaultJourneyScoreWorkflow {
  store: DefaultJourneyScoreStore;
  validator: DefaultJourneyScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultJourneyScoreEngine;

  constructor(
    store: DefaultJourneyScoreStore,
    validator: DefaultJourneyScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultJourneyScoreEngine,
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
      throw new Error(`default journey score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default journey score ${code} not found`);
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
      throw new Error(`default journey score ${code} not found`);
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

export function newDefaultJourneyScoreWorkflow(store: DefaultJourneyScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultJourneyScoreWorkflow {
  return new DefaultJourneyScoreWorkflow(
    store,
    defaultDefaultJourneyScoreValidator(),
    clockValue,
    [],
    defaultDefaultJourneyScoreEngine(flagsValue),
  );
}
