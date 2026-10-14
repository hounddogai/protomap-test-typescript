import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientOptOutScoreEngine, defaultLenientOptOutScoreEngine } from "./lenient-opt-out-score-engine.js";
import { LenientOptOutScoreValidator, defaultLenientOptOutScoreValidator } from "./lenient-opt-out-score-rules.js";
import { LenientOptOutScoreStore } from "./lenient-opt-out-score-store.js";

/** Moves lenient opt out scores through their life cycle and keeps a journal of what it did. */
export class LenientOptOutScoreService {
  store: LenientOptOutScoreStore;
  validator: LenientOptOutScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientOptOutScoreEngine;

  constructor(
    store: LenientOptOutScoreStore,
    validator: LenientOptOutScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientOptOutScoreEngine,
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
      throw new Error(`lenient opt out score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient opt out score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient opt out score ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newLenientOptOutScoreService(store: LenientOptOutScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientOptOutScoreService {
  return new LenientOptOutScoreService(
    store,
    defaultLenientOptOutScoreValidator(),
    clockValue,
    [],
    defaultLenientOptOutScoreEngine(flagsValue),
  );
}
