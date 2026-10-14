import * as clock from "../../../../kit/clock.js";
import { WarmupRequestEngine, defaultWarmupRequestEngine } from "./warmup-request-engine.js";
import { WarmupRequestValidator, defaultWarmupRequestValidator } from "./warmup-request-rules.js";
import { WarmupRequestStore } from "./warmup-request-store.js";

/** Moves warmup requests through their life cycle and keeps a journal of what it did. */
export class WarmupRequestManager {
  store: WarmupRequestStore;
  validator: WarmupRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupRequestEngine;

  constructor(
    store: WarmupRequestStore,
    validator: WarmupRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupRequestEngine,
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
      throw new Error(`warmup request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup request ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWarmupRequestManager(store: WarmupRequestStore, clockValue: clock.Clock): WarmupRequestManager {
  return new WarmupRequestManager(store, defaultWarmupRequestValidator(), clockValue, [], defaultWarmupRequestEngine());
}
