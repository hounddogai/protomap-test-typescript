import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryConversionRuleEngine, defaultPrimaryConversionRuleEngine } from "./primary-conversion-rule-engine.js";
import {
  PrimaryConversionRuleValidator,
  defaultPrimaryConversionRuleValidator,
} from "./primary-conversion-rule-rules.js";
import { PrimaryConversionRuleStore } from "./primary-conversion-rule-store.js";

/** Moves primary conversion rules through their life cycle and keeps a journal of what it did. */
export class PrimaryConversionRuleService {
  store: PrimaryConversionRuleStore;
  validator: PrimaryConversionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryConversionRuleEngine;

  constructor(
    store: PrimaryConversionRuleStore,
    validator: PrimaryConversionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryConversionRuleEngine,
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
      throw new Error(`primary conversion rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary conversion rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary conversion rule ${code} not found`);
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

export function newPrimaryConversionRuleService(store: PrimaryConversionRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryConversionRuleService {
  return new PrimaryConversionRuleService(
    store,
    defaultPrimaryConversionRuleValidator(),
    clockValue,
    [],
    defaultPrimaryConversionRuleEngine(flagsValue),
  );
}
