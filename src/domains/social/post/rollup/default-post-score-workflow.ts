import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultPostScoreEngine, defaultDefaultPostScoreEngine } from "./default-post-score-engine.js";
import { DefaultPostScoreValidator, defaultDefaultPostScoreValidator } from "./default-post-score-rules.js";
import { DefaultPostScoreStore } from "./default-post-score-store.js";

/** Moves default post scores through their life cycle and keeps a journal of what it did. */
export class DefaultPostScoreManager {
  store: DefaultPostScoreStore;
  validator: DefaultPostScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPostScoreEngine;

  constructor(
    store: DefaultPostScoreStore,
    validator: DefaultPostScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPostScoreEngine,
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
      throw new Error(`default post score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default post score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default post score ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDefaultPostScoreManager(store: DefaultPostScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultPostScoreManager {
  return new DefaultPostScoreManager(
    store,
    defaultDefaultPostScoreValidator(),
    clockValue,
    [],
    defaultDefaultPostScoreEngine(flagsValue),
  );
}
