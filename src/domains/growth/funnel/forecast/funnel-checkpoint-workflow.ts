import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FunnelCheckpointEngine, defaultFunnelCheckpointEngine } from "./funnel-checkpoint-engine.js";
import { FunnelCheckpointValidator, defaultFunnelCheckpointValidator } from "./funnel-checkpoint-rules.js";
import { FunnelCheckpointStore } from "./funnel-checkpoint-store.js";

/** Moves funnel checkpoints through their life cycle and keeps a journal of what it did. */
export class FunnelCheckpointManager {
  store: FunnelCheckpointStore;
  validator: FunnelCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelCheckpointEngine;

  constructor(
    store: FunnelCheckpointStore,
    validator: FunnelCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelCheckpointEngine,
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
      throw new Error(`funnel checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel checkpoint ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFunnelCheckpointManager(store: FunnelCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): FunnelCheckpointManager {
  return new FunnelCheckpointManager(
    store,
    defaultFunnelCheckpointValidator(),
    clockValue,
    [],
    defaultFunnelCheckpointEngine(flagsValue),
  );
}
