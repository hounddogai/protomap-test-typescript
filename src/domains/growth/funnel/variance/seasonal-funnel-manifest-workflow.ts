import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalFunnelManifestEngine,
  defaultSeasonalFunnelManifestEngine,
} from "./seasonal-funnel-manifest-engine.js";
import {
  SeasonalFunnelManifestValidator,
  defaultSeasonalFunnelManifestValidator,
} from "./seasonal-funnel-manifest-rules.js";
import { SeasonalFunnelManifestStore } from "./seasonal-funnel-manifest-store.js";

/** Moves seasonal funnel manifests through their life cycle and keeps a journal of what it did. */
export class SeasonalFunnelManifestDesk {
  store: SeasonalFunnelManifestStore;
  validator: SeasonalFunnelManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalFunnelManifestEngine;

  constructor(
    store: SeasonalFunnelManifestStore,
    validator: SeasonalFunnelManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalFunnelManifestEngine,
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
      throw new Error(`seasonal funnel manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal funnel manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal funnel manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSeasonalFunnelManifestDesk(store: SeasonalFunnelManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalFunnelManifestDesk {
  return new SeasonalFunnelManifestDesk(
    store,
    defaultSeasonalFunnelManifestValidator(),
    clockValue,
    [],
    defaultSeasonalFunnelManifestEngine(flagsValue),
  );
}
