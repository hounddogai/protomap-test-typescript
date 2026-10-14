import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FunnelManifestEngine, defaultFunnelManifestEngine } from "./funnel-manifest-engine.js";
import { FunnelManifestValidator, defaultFunnelManifestValidator } from "./funnel-manifest-rules.js";
import { FunnelManifestStore } from "./funnel-manifest-store.js";

/** Moves funnel manifests through their life cycle and keeps a journal of what it did. */
export class FunnelManifestDesk {
  store: FunnelManifestStore;
  validator: FunnelManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelManifestEngine;

  constructor(
    store: FunnelManifestStore,
    validator: FunnelManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelManifestEngine,
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
      throw new Error(`funnel manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel manifest ${code} not found`);
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
      throw new Error(`funnel manifest ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newFunnelManifestDesk(store: FunnelManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): FunnelManifestDesk {
  return new FunnelManifestDesk(
    store,
    defaultFunnelManifestValidator(),
    clockValue,
    [],
    defaultFunnelManifestEngine(flagsValue),
  );
}
