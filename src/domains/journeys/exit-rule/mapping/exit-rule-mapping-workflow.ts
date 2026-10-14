import * as clock from "../../../../kit/clock.js";
import { ExitRuleMappingEngine, defaultExitRuleMappingEngine } from "./exit-rule-mapping-engine.js";
import { ExitRuleMappingValidator, defaultExitRuleMappingValidator } from "./exit-rule-mapping-rules.js";
import { ExitRuleMappingStore } from "./exit-rule-mapping-store.js";

/** Moves exit rule mappings through their life cycle and keeps a journal of what it did. */
export class ExitRuleMappingDesk {
  store: ExitRuleMappingStore;
  validator: ExitRuleMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleMappingEngine;

  constructor(
    store: ExitRuleMappingStore,
    validator: ExitRuleMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleMappingEngine,
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
      throw new Error(`exit rule mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newExitRuleMappingDesk(store: ExitRuleMappingStore, clockValue: clock.Clock): ExitRuleMappingDesk {
  return new ExitRuleMappingDesk(
    store,
    defaultExitRuleMappingValidator(),
    clockValue,
    [],
    defaultExitRuleMappingEngine(),
  );
}
