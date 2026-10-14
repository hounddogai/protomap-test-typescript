import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathEstimateEngine, defaultPathEstimateEngine } from "./path-estimate-engine.js";
import { PathEstimateValidator, defaultPathEstimateValidator } from "./path-estimate-rules.js";
import { PathEstimateStore } from "./path-estimate-store.js";

/** Moves path estimates through their life cycle and keeps a journal of what it did. */
export class PathEstimateService {
  store: PathEstimateStore;
  validator: PathEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathEstimateEngine;

  constructor(
    store: PathEstimateStore,
    validator: PathEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathEstimateEngine,
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
      throw new Error(`path estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path estimate ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPathEstimateService(store: PathEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathEstimateService {
  return new PathEstimateService(
    store,
    defaultPathEstimateValidator(),
    clockValue,
    [],
    defaultPathEstimateEngine(flagsValue),
  );
}
