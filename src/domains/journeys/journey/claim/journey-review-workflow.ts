import * as clock from "../../../../kit/clock.js";
import { JourneyReviewEngine, defaultJourneyReviewEngine } from "./journey-review-engine.js";
import { JourneyReviewValidator, defaultJourneyReviewValidator } from "./journey-review-rules.js";
import { JourneyReviewStore } from "./journey-review-store.js";

/** Moves journey reviews through their life cycle and keeps a journal of what it did. */
export class JourneyReviewService {
  store: JourneyReviewStore;
  validator: JourneyReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyReviewEngine;

  constructor(
    store: JourneyReviewStore,
    validator: JourneyReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyReviewEngine,
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
      throw new Error(`journey review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey review ${code} not found`);
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
      throw new Error(`journey review ${code} not found`);
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

export function newJourneyReviewService(store: JourneyReviewStore, clockValue: clock.Clock): JourneyReviewService {
  return new JourneyReviewService(store, defaultJourneyReviewValidator(), clockValue, [], defaultJourneyReviewEngine());
}
