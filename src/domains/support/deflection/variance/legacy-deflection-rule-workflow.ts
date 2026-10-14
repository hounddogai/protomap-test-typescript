import * as clock from "../../../../kit/clock.js";
import { LegacyDeflectionRuleEngine, defaultLegacyDeflectionRuleEngine } from "./legacy-deflection-rule-engine.js";
import {
  LegacyDeflectionRuleValidator,
  defaultLegacyDeflectionRuleValidator,
} from "./legacy-deflection-rule-rules.js";
import { LegacyDeflectionRuleStore } from "./legacy-deflection-rule-store.js";

/** Moves legacy deflection rules through their life cycle and keeps a journal of what it did. */
export class LegacyDeflectionRuleManager {
  store: LegacyDeflectionRuleStore;
  validator: LegacyDeflectionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyDeflectionRuleEngine;

  constructor(
    store: LegacyDeflectionRuleStore,
    validator: LegacyDeflectionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyDeflectionRuleEngine,
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
      throw new Error(`legacy deflection rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection rule ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLegacyDeflectionRuleManager(store: LegacyDeflectionRuleStore, clockValue: clock.Clock): LegacyDeflectionRuleManager {
  return new LegacyDeflectionRuleManager(
    store,
    defaultLegacyDeflectionRuleValidator(),
    clockValue,
    [],
    defaultLegacyDeflectionRuleEngine(),
  );
}
