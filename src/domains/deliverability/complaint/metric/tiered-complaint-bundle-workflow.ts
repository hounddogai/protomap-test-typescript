import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredComplaintBundleEngine, defaultTieredComplaintBundleEngine } from "./tiered-complaint-bundle-engine.js";
import {
  TieredComplaintBundleValidator,
  defaultTieredComplaintBundleValidator,
} from "./tiered-complaint-bundle-rules.js";
import { TieredComplaintBundleStore } from "./tiered-complaint-bundle-store.js";

/** Moves tiered complaint bundles through their life cycle and keeps a journal of what it did. */
export class TieredComplaintBundleCoordinator {
  store: TieredComplaintBundleStore;
  validator: TieredComplaintBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredComplaintBundleEngine;

  constructor(
    store: TieredComplaintBundleStore,
    validator: TieredComplaintBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredComplaintBundleEngine,
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
      throw new Error(`tiered complaint bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered complaint bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered complaint bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredComplaintBundleCoordinator(store: TieredComplaintBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredComplaintBundleCoordinator {
  return new TieredComplaintBundleCoordinator(
    store,
    defaultTieredComplaintBundleValidator(),
    clockValue,
    [],
    defaultTieredComplaintBundleEngine(flagsValue),
  );
}
