import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { JourneyScoreEngine, defaultJourneyScoreEngine } from "./journey-score-engine.js";
import { JourneyScoreValidator, defaultJourneyScoreValidator } from "./journey-score-rules.js";
import { JourneyScoreStore } from "./journey-score-store.js";

/** Moves journey scores through their life cycle and keeps a journal of what it did. */
export class JourneyScoreDesk {
  store: JourneyScoreStore;
  validator: JourneyScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyScoreEngine;

  constructor(
    store: JourneyScoreStore,
    validator: JourneyScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyScoreEngine,
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
      throw new Error(`journey score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey score ${code} not found`);
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

export function newJourneyScoreDesk(store: JourneyScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): JourneyScoreDesk {
  return new JourneyScoreDesk(
    store,
    defaultJourneyScoreValidator(),
    clockValue,
    [],
    defaultJourneyScoreEngine(flagsValue),
  );
}
