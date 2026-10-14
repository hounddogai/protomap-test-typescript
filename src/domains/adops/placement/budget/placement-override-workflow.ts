import * as clock from "../../../../kit/clock.js";
import { PlacementOverrideEngine, defaultPlacementOverrideEngine } from "./placement-override-engine.js";
import { PlacementOverrideValidator, defaultPlacementOverrideValidator } from "./placement-override-rules.js";
import { PlacementOverrideStore } from "./placement-override-store.js";

/** Moves placement overrides through their life cycle and keeps a journal of what it did. */
export class PlacementOverrideWorkflow {
  store: PlacementOverrideStore;
  validator: PlacementOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementOverrideEngine;

  constructor(
    store: PlacementOverrideStore,
    validator: PlacementOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementOverrideEngine,
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
      throw new Error(`placement override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement override ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPlacementOverrideWorkflow(store: PlacementOverrideStore, clockValue: clock.Clock): PlacementOverrideWorkflow {
  return new PlacementOverrideWorkflow(
    store,
    defaultPlacementOverrideValidator(),
    clockValue,
    [],
    defaultPlacementOverrideEngine(),
  );
}
