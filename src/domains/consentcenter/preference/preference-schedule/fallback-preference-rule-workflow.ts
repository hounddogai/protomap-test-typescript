import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackPreferenceRuleEngine,
  defaultFallbackPreferenceRuleEngine,
} from "./fallback-preference-rule-engine.js";
import {
  FallbackPreferenceRuleValidator,
  defaultFallbackPreferenceRuleValidator,
} from "./fallback-preference-rule-rules.js";
import { FallbackPreferenceRuleStore } from "./fallback-preference-rule-store.js";

/** Moves fallback preference rules through their life cycle and keeps a journal of what it did. */
export class FallbackPreferenceRuleService {
  store: FallbackPreferenceRuleStore;
  validator: FallbackPreferenceRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackPreferenceRuleEngine;

  constructor(
    store: FallbackPreferenceRuleStore,
    validator: FallbackPreferenceRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackPreferenceRuleEngine,
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
      throw new Error(`fallback preference rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback preference rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback preference rule ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackPreferenceRuleService(store: FallbackPreferenceRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackPreferenceRuleService {
  return new FallbackPreferenceRuleService(
    store,
    defaultFallbackPreferenceRuleValidator(),
    clockValue,
    [],
    defaultFallbackPreferenceRuleEngine(flagsValue),
  );
}
