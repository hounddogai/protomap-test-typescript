import * as clock from "../../../../kit/clock.js";
import { LegacyCreativeGroupEngine, defaultLegacyCreativeGroupEngine } from "./legacy-creative-group-engine.js";
import { LegacyCreativeGroupValidator, defaultLegacyCreativeGroupValidator } from "./legacy-creative-group-rules.js";
import { LegacyCreativeGroupStore } from "./legacy-creative-group-store.js";

/** Moves legacy creative groups through their life cycle and keeps a journal of what it did. */
export class LegacyCreativeGroupWorkflow {
  store: LegacyCreativeGroupStore;
  validator: LegacyCreativeGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyCreativeGroupEngine;

  constructor(
    store: LegacyCreativeGroupStore,
    validator: LegacyCreativeGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyCreativeGroupEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative group ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyCreativeGroupWorkflow(store: LegacyCreativeGroupStore, clockValue: clock.Clock): LegacyCreativeGroupWorkflow {
  return new LegacyCreativeGroupWorkflow(
    store,
    defaultLegacyCreativeGroupValidator(),
    clockValue,
    [],
    defaultLegacyCreativeGroupEngine(),
  );
}
