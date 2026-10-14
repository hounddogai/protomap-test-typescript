import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredBounceDraftEngine, defaultTieredBounceDraftEngine } from "./tiered-bounce-draft-engine.js";
import { TieredBounceDraftValidator, defaultTieredBounceDraftValidator } from "./tiered-bounce-draft-rules.js";
import { TieredBounceDraftStore } from "./tiered-bounce-draft-store.js";

/** Moves tiered bounce drafts through their life cycle and keeps a journal of what it did. */
export class TieredBounceDraftWorkflow {
  store: TieredBounceDraftStore;
  validator: TieredBounceDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredBounceDraftEngine;

  constructor(
    store: TieredBounceDraftStore,
    validator: TieredBounceDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredBounceDraftEngine,
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
      throw new Error(`tiered bounce draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered bounce draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered bounce draft ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTieredBounceDraftWorkflow(store: TieredBounceDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredBounceDraftWorkflow {
  return new TieredBounceDraftWorkflow(
    store,
    defaultTieredBounceDraftValidator(),
    clockValue,
    [],
    defaultTieredBounceDraftEngine(flagsValue),
  );
}
