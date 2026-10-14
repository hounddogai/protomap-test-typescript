import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedSlaCheckpointEngine, defaultCappedSlaCheckpointEngine } from "./capped-sla-checkpoint-engine.js";
import { CappedSlaCheckpointValidator, defaultCappedSlaCheckpointValidator } from "./capped-sla-checkpoint-rules.js";
import { CappedSlaCheckpointStore } from "./capped-sla-checkpoint-store.js";

/** Moves capped sla checkpoints through their life cycle and keeps a journal of what it did. */
export class CappedSlaCheckpointManager {
  store: CappedSlaCheckpointStore;
  validator: CappedSlaCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedSlaCheckpointEngine;

  constructor(
    store: CappedSlaCheckpointStore,
    validator: CappedSlaCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedSlaCheckpointEngine,
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
      throw new Error(`capped sla checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped sla checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped sla checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newCappedSlaCheckpointManager(store: CappedSlaCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedSlaCheckpointManager {
  return new CappedSlaCheckpointManager(
    store,
    defaultCappedSlaCheckpointValidator(),
    clockValue,
    [],
    defaultCappedSlaCheckpointEngine(flagsValue),
  );
}
