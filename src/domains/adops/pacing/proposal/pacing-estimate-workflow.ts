import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingEstimateEngine, defaultPacingEstimateEngine } from "./pacing-estimate-engine.js";
import { PacingEstimateValidator, defaultPacingEstimateValidator } from "./pacing-estimate-rules.js";
import { PacingEstimateStore } from "./pacing-estimate-store.js";

/** Moves pacing estimates through their life cycle and keeps a journal of what it did. */
export class PacingEstimateService {
  store: PacingEstimateStore;
  validator: PacingEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingEstimateEngine;

  constructor(
    store: PacingEstimateStore,
    validator: PacingEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingEstimateEngine,
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
      throw new Error(`pacing estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPacingEstimateService(store: PacingEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingEstimateService {
  return new PacingEstimateService(
    store,
    defaultPacingEstimateValidator(),
    clockValue,
    [],
    defaultPacingEstimateEngine(flagsValue),
  );
}
