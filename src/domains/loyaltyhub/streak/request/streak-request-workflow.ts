import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StreakRequestEngine, defaultStreakRequestEngine } from "./streak-request-engine.js";
import { StreakRequestValidator, defaultStreakRequestValidator } from "./streak-request-rules.js";
import { StreakRequestStore } from "./streak-request-store.js";

/** Moves streak requests through their life cycle and keeps a journal of what it did. */
export class StreakRequestService {
  store: StreakRequestStore;
  validator: StreakRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakRequestEngine;

  constructor(
    store: StreakRequestStore,
    validator: StreakRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakRequestEngine,
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
      throw new Error(`streak request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStreakRequestService(store: StreakRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): StreakRequestService {
  return new StreakRequestService(
    store,
    defaultStreakRequestValidator(),
    clockValue,
    [],
    defaultStreakRequestEngine(flagsValue),
  );
}
