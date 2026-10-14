import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveSuppressionRequestEngine,
  defaultAdaptiveSuppressionRequestEngine,
} from "./adaptive-suppression-request-engine.js";
import {
  AdaptiveSuppressionRequestValidator,
  defaultAdaptiveSuppressionRequestValidator,
} from "./adaptive-suppression-request-rules.js";
import { AdaptiveSuppressionRequestStore } from "./adaptive-suppression-request-store.js";

/** Moves adaptive suppression requests through their life cycle and keeps a journal of what it did. */
export class AdaptiveSuppressionRequestCoordinator {
  store: AdaptiveSuppressionRequestStore;
  validator: AdaptiveSuppressionRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveSuppressionRequestEngine;

  constructor(
    store: AdaptiveSuppressionRequestStore,
    validator: AdaptiveSuppressionRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveSuppressionRequestEngine,
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
      throw new Error(`adaptive suppression request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive suppression request ${code} not found`);
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
      throw new Error(`adaptive suppression request ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveSuppressionRequestCoordinator(store: AdaptiveSuppressionRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveSuppressionRequestCoordinator {
  return new AdaptiveSuppressionRequestCoordinator(
    store,
    defaultAdaptiveSuppressionRequestValidator(),
    clockValue,
    [],
    defaultAdaptiveSuppressionRequestEngine(flagsValue),
  );
}
