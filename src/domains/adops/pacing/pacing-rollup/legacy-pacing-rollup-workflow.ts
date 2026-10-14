import * as clock from "../../../../kit/clock.js";
import { LegacyPacingRollupEngine, defaultLegacyPacingRollupEngine } from "./legacy-pacing-rollup-engine.js";
import { LegacyPacingRollupValidator, defaultLegacyPacingRollupValidator } from "./legacy-pacing-rollup-rules.js";
import { LegacyPacingRollupStore } from "./legacy-pacing-rollup-store.js";

/** Moves legacy pacing rollups through their life cycle and keeps a journal of what it did. */
export class LegacyPacingRollupService {
  store: LegacyPacingRollupStore;
  validator: LegacyPacingRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPacingRollupEngine;

  constructor(
    store: LegacyPacingRollupStore,
    validator: LegacyPacingRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPacingRollupEngine,
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
      throw new Error(`legacy pacing rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy pacing rollup ${code} not found`);
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
      throw new Error(`legacy pacing rollup ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newLegacyPacingRollupService(store: LegacyPacingRollupStore, clockValue: clock.Clock): LegacyPacingRollupService {
  return new LegacyPacingRollupService(
    store,
    defaultLegacyPacingRollupValidator(),
    clockValue,
    [],
    defaultLegacyPacingRollupEngine(),
  );
}
