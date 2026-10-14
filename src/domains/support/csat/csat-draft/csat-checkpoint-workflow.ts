import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CsatCheckpointEngine, defaultCsatCheckpointEngine } from "./csat-checkpoint-engine.js";
import { CsatCheckpointValidator, defaultCsatCheckpointValidator } from "./csat-checkpoint-rules.js";
import { CsatCheckpointStore } from "./csat-checkpoint-store.js";

/** Moves csat checkpoints through their life cycle and keeps a journal of what it did. */
export class CsatCheckpointManager {
  store: CsatCheckpointStore;
  validator: CsatCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatCheckpointEngine;

  constructor(
    store: CsatCheckpointStore,
    validator: CsatCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatCheckpointEngine,
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
      throw new Error(`csat checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat checkpoint ${code} not found`);
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
      throw new Error(`csat checkpoint ${code} not found`);
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

export function newCsatCheckpointManager(store: CsatCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): CsatCheckpointManager {
  return new CsatCheckpointManager(
    store,
    defaultCsatCheckpointValidator(),
    clockValue,
    [],
    defaultCsatCheckpointEngine(flagsValue),
  );
}
