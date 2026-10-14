import * as clock from "../../../../kit/clock.js";
import { CsatEstimateEngine, defaultCsatEstimateEngine } from "./csat-estimate-engine.js";
import { CsatEstimateValidator, defaultCsatEstimateValidator } from "./csat-estimate-rules.js";
import { CsatEstimateStore } from "./csat-estimate-store.js";

/** Moves csat estimates through their life cycle and keeps a journal of what it did. */
export class CsatEstimateManager {
  store: CsatEstimateStore;
  validator: CsatEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatEstimateEngine;

  constructor(
    store: CsatEstimateStore,
    validator: CsatEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatEstimateEngine,
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
      throw new Error(`csat estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat estimate ${code} not found`);
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
      throw new Error(`csat estimate ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newCsatEstimateManager(store: CsatEstimateStore, clockValue: clock.Clock): CsatEstimateManager {
  return new CsatEstimateManager(store, defaultCsatEstimateValidator(), clockValue, [], defaultCsatEstimateEngine());
}
