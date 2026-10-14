import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientCsatCheckpointEngine, defaultLenientCsatCheckpointEngine } from "./lenient-csat-checkpoint-engine.js";
import {
  LenientCsatCheckpointValidator,
  defaultLenientCsatCheckpointValidator,
} from "./lenient-csat-checkpoint-rules.js";
import { LenientCsatCheckpointStore } from "./lenient-csat-checkpoint-store.js";

/** Moves lenient csat checkpoints through their life cycle and keeps a journal of what it did. */
export class LenientCsatCheckpointWorkflow {
  store: LenientCsatCheckpointStore;
  validator: LenientCsatCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientCsatCheckpointEngine;

  constructor(
    store: LenientCsatCheckpointStore,
    validator: LenientCsatCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientCsatCheckpointEngine,
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
      throw new Error(`lenient csat checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient csat checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient csat checkpoint ${code} not found`);
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

export function newLenientCsatCheckpointWorkflow(store: LenientCsatCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientCsatCheckpointWorkflow {
  return new LenientCsatCheckpointWorkflow(
    store,
    defaultLenientCsatCheckpointValidator(),
    clockValue,
    [],
    defaultLenientCsatCheckpointEngine(flagsValue),
  );
}
