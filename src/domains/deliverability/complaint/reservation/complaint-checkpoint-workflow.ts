import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ComplaintCheckpointEngine, defaultComplaintCheckpointEngine } from "./complaint-checkpoint-engine.js";
import { ComplaintCheckpointValidator, defaultComplaintCheckpointValidator } from "./complaint-checkpoint-rules.js";
import { ComplaintCheckpointStore } from "./complaint-checkpoint-store.js";

/** Moves complaint checkpoints through their life cycle and keeps a journal of what it did. */
export class ComplaintCheckpointService {
  store: ComplaintCheckpointStore;
  validator: ComplaintCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintCheckpointEngine;

  constructor(
    store: ComplaintCheckpointStore,
    validator: ComplaintCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintCheckpointEngine,
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
      throw new Error(`complaint checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newComplaintCheckpointService(store: ComplaintCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): ComplaintCheckpointService {
  return new ComplaintCheckpointService(
    store,
    defaultComplaintCheckpointValidator(),
    clockValue,
    [],
    defaultComplaintCheckpointEngine(flagsValue),
  );
}
