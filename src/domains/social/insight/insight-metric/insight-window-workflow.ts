import * as clock from "../../../../kit/clock.js";
import { InsightWindowEngine, defaultInsightWindowEngine } from "./insight-window-engine.js";
import { InsightWindowValidator, defaultInsightWindowValidator } from "./insight-window-rules.js";
import { InsightWindowStore } from "./insight-window-store.js";

/** Moves insight windows through their life cycle and keeps a journal of what it did. */
export class InsightWindowDesk {
  store: InsightWindowStore;
  validator: InsightWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightWindowEngine;

  constructor(
    store: InsightWindowStore,
    validator: InsightWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightWindowEngine,
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
      throw new Error(`insight window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInsightWindowDesk(store: InsightWindowStore, clockValue: clock.Clock): InsightWindowDesk {
  return new InsightWindowDesk(store, defaultInsightWindowValidator(), clockValue, [], defaultInsightWindowEngine());
}
