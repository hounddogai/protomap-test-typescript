import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PlacementDigestEngine, defaultPlacementDigestEngine } from "./placement-digest-engine.js";
import { PlacementDigestValidator, defaultPlacementDigestValidator } from "./placement-digest-rules.js";
import { PlacementDigestStore } from "./placement-digest-store.js";

/** Moves placement digests through their life cycle and keeps a journal of what it did. */
export class PlacementDigestWorkflow {
  store: PlacementDigestStore;
  validator: PlacementDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementDigestEngine;

  constructor(
    store: PlacementDigestStore,
    validator: PlacementDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementDigestEngine,
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
      throw new Error(`placement digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPlacementDigestWorkflow(store: PlacementDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): PlacementDigestWorkflow {
  return new PlacementDigestWorkflow(
    store,
    defaultPlacementDigestValidator(),
    clockValue,
    [],
    defaultPlacementDigestEngine(flagsValue),
  );
}
