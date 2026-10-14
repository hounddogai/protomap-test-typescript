import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveExitRuleBundleEngine,
  defaultAdaptiveExitRuleBundleEngine,
} from "./adaptive-exit-rule-bundle-engine.js";
import {
  AdaptiveExitRuleBundleValidator,
  defaultAdaptiveExitRuleBundleValidator,
} from "./adaptive-exit-rule-bundle-rules.js";
import { AdaptiveExitRuleBundleStore } from "./adaptive-exit-rule-bundle-store.js";

/** Moves adaptive exit rule bundles through their life cycle and keeps a journal of what it did. */
export class AdaptiveExitRuleBundleService {
  store: AdaptiveExitRuleBundleStore;
  validator: AdaptiveExitRuleBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveExitRuleBundleEngine;

  constructor(
    store: AdaptiveExitRuleBundleStore,
    validator: AdaptiveExitRuleBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveExitRuleBundleEngine,
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
      throw new Error(`adaptive exit rule bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive exit rule bundle ${code} not found`);
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
      throw new Error(`adaptive exit rule bundle ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newAdaptiveExitRuleBundleService(store: AdaptiveExitRuleBundleStore, clockValue: clock.Clock): AdaptiveExitRuleBundleService {
  return new AdaptiveExitRuleBundleService(
    store,
    defaultAdaptiveExitRuleBundleValidator(),
    clockValue,
    [],
    defaultAdaptiveExitRuleBundleEngine(),
  );
}
