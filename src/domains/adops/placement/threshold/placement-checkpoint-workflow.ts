import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PlacementCheckpointEngine, defaultPlacementCheckpointEngine } from "./placement-checkpoint-engine.js";
import { PlacementCheckpointValidator, defaultPlacementCheckpointValidator } from "./placement-checkpoint-rules.js";
import { PlacementCheckpointStore } from "./placement-checkpoint-store.js";

/** Moves placement checkpoints through their life cycle and keeps a journal of what it did. */
export class PlacementCheckpointWorkflow {
  store: PlacementCheckpointStore;
  validator: PlacementCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementCheckpointEngine;

  constructor(
    store: PlacementCheckpointStore,
    validator: PlacementCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementCheckpointEngine,
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
      throw new Error(`placement checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement checkpoint ${code} not found`);
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
      throw new Error(`placement checkpoint ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPlacementCheckpointWorkflow(store: PlacementCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): PlacementCheckpointWorkflow {
  return new PlacementCheckpointWorkflow(
    store,
    defaultPlacementCheckpointValidator(),
    clockValue,
    [],
    defaultPlacementCheckpointEngine(flagsValue),
  );
}
