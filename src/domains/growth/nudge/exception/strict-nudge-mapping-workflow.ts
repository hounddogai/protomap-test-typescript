import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictNudgeMappingEngine, defaultStrictNudgeMappingEngine } from "./strict-nudge-mapping-engine.js";
import { StrictNudgeMappingValidator, defaultStrictNudgeMappingValidator } from "./strict-nudge-mapping-rules.js";
import { StrictNudgeMappingStore } from "./strict-nudge-mapping-store.js";

/** Moves strict nudge mappings through their life cycle and keeps a journal of what it did. */
export class StrictNudgeMappingCoordinator {
  store: StrictNudgeMappingStore;
  validator: StrictNudgeMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictNudgeMappingEngine;

  constructor(
    store: StrictNudgeMappingStore,
    validator: StrictNudgeMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictNudgeMappingEngine,
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
      throw new Error(`strict nudge mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict nudge mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict nudge mapping ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictNudgeMappingCoordinator(store: StrictNudgeMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictNudgeMappingCoordinator {
  return new StrictNudgeMappingCoordinator(
    store,
    defaultStrictNudgeMappingValidator(),
    clockValue,
    [],
    defaultStrictNudgeMappingEngine(flagsValue),
  );
}
