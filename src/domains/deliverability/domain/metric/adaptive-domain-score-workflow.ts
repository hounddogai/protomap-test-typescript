import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveDomainScoreEngine, defaultAdaptiveDomainScoreEngine } from "./adaptive-domain-score-engine.js";
import { AdaptiveDomainScoreValidator, defaultAdaptiveDomainScoreValidator } from "./adaptive-domain-score-rules.js";
import { AdaptiveDomainScoreStore } from "./adaptive-domain-score-store.js";

/** Moves adaptive domain scores through their life cycle and keeps a journal of what it did. */
export class AdaptiveDomainScoreWorkflow {
  store: AdaptiveDomainScoreStore;
  validator: AdaptiveDomainScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDomainScoreEngine;

  constructor(
    store: AdaptiveDomainScoreStore,
    validator: AdaptiveDomainScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDomainScoreEngine,
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
      throw new Error(`adaptive domain score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain score ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptiveDomainScoreWorkflow(store: AdaptiveDomainScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveDomainScoreWorkflow {
  return new AdaptiveDomainScoreWorkflow(
    store,
    defaultAdaptiveDomainScoreValidator(),
    clockValue,
    [],
    defaultAdaptiveDomainScoreEngine(flagsValue),
  );
}
