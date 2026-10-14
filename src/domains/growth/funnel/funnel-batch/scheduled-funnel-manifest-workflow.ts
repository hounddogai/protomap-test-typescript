import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledFunnelManifestEngine,
  defaultScheduledFunnelManifestEngine,
} from "./scheduled-funnel-manifest-engine.js";
import {
  ScheduledFunnelManifestValidator,
  defaultScheduledFunnelManifestValidator,
} from "./scheduled-funnel-manifest-rules.js";
import { ScheduledFunnelManifestStore } from "./scheduled-funnel-manifest-store.js";

/** Moves scheduled funnel manifests through their life cycle and keeps a journal of what it did. */
export class ScheduledFunnelManifestService {
  store: ScheduledFunnelManifestStore;
  validator: ScheduledFunnelManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFunnelManifestEngine;

  constructor(
    store: ScheduledFunnelManifestStore,
    validator: ScheduledFunnelManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFunnelManifestEngine,
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
      throw new Error(`scheduled funnel manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled funnel manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled funnel manifest ${code} not found`);
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

export function newScheduledFunnelManifestService(store: ScheduledFunnelManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledFunnelManifestService {
  return new ScheduledFunnelManifestService(
    store,
    defaultScheduledFunnelManifestValidator(),
    clockValue,
    [],
    defaultScheduledFunnelManifestEngine(flagsValue),
  );
}
