import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveDeflectionScoreEngine,
  defaultAdaptiveDeflectionScoreEngine,
} from "./adaptive-deflection-score-engine.js";
import {
  AdaptiveDeflectionScoreValidator,
  defaultAdaptiveDeflectionScoreValidator,
} from "./adaptive-deflection-score-rules.js";
import { AdaptiveDeflectionScoreStore } from "./adaptive-deflection-score-store.js";

/** Moves adaptive deflection scores through their life cycle and keeps a journal of what it did. */
export class AdaptiveDeflectionScoreDesk {
  store: AdaptiveDeflectionScoreStore;
  validator: AdaptiveDeflectionScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDeflectionScoreEngine;

  constructor(
    store: AdaptiveDeflectionScoreStore,
    validator: AdaptiveDeflectionScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDeflectionScoreEngine,
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
      throw new Error(`adaptive deflection score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive deflection score ${code} not found`);
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
      throw new Error(`adaptive deflection score ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newAdaptiveDeflectionScoreDesk(store: AdaptiveDeflectionScoreStore, clockValue: clock.Clock): AdaptiveDeflectionScoreDesk {
  return new AdaptiveDeflectionScoreDesk(
    store,
    defaultAdaptiveDeflectionScoreValidator(),
    clockValue,
    [],
    defaultAdaptiveDeflectionScoreEngine(),
  );
}
