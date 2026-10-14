import * as clock from "../../../../kit/clock.js";
import { InsightScoreEngine, defaultInsightScoreEngine } from "./insight-score-engine.js";
import { InsightScoreValidator, defaultInsightScoreValidator } from "./insight-score-rules.js";
import { InsightScoreStore } from "./insight-score-store.js";

/** Moves insight scores through their life cycle and keeps a journal of what it did. */
export class InsightScoreCoordinator {
  store: InsightScoreStore;
  validator: InsightScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightScoreEngine;

  constructor(
    store: InsightScoreStore,
    validator: InsightScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightScoreEngine,
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
      throw new Error(`insight score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight score ${code} not found`);
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

export function newInsightScoreCoordinator(store: InsightScoreStore, clockValue: clock.Clock): InsightScoreCoordinator {
  return new InsightScoreCoordinator(
    store,
    defaultInsightScoreValidator(),
    clockValue,
    [],
    defaultInsightScoreEngine(),
  );
}
