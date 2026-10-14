import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeScoreEngine, defaultCreativeScoreEngine } from "./creative-score-engine.js";
import { CreativeScoreValidator, defaultCreativeScoreValidator } from "./creative-score-rules.js";
import { CreativeScoreStore } from "./creative-score-store.js";

/** Moves creative scores through their life cycle and keeps a journal of what it did. */
export class CreativeScoreWorkflow {
  store: CreativeScoreStore;
  validator: CreativeScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeScoreEngine;

  constructor(
    store: CreativeScoreStore,
    validator: CreativeScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeScoreEngine,
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
      throw new Error(`creative score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative score ${code} not found`);
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
      throw new Error(`creative score ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newCreativeScoreWorkflow(store: CreativeScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeScoreWorkflow {
  return new CreativeScoreWorkflow(
    store,
    defaultCreativeScoreValidator(),
    clockValue,
    [],
    defaultCreativeScoreEngine(flagsValue),
  );
}
