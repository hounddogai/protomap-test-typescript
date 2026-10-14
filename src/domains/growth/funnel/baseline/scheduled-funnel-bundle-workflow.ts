import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ScheduledFunnelBundleEngine, defaultScheduledFunnelBundleEngine } from "./scheduled-funnel-bundle-engine.js";
import {
  ScheduledFunnelBundleValidator,
  defaultScheduledFunnelBundleValidator,
} from "./scheduled-funnel-bundle-rules.js";
import { ScheduledFunnelBundleStore } from "./scheduled-funnel-bundle-store.js";

/** Moves scheduled funnel bundles through their life cycle and keeps a journal of what it did. */
export class ScheduledFunnelBundleDesk {
  store: ScheduledFunnelBundleStore;
  validator: ScheduledFunnelBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFunnelBundleEngine;

  constructor(
    store: ScheduledFunnelBundleStore,
    validator: ScheduledFunnelBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFunnelBundleEngine,
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
      throw new Error(`scheduled funnel bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled funnel bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled funnel bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledFunnelBundleDesk(store: ScheduledFunnelBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledFunnelBundleDesk {
  return new ScheduledFunnelBundleDesk(
    store,
    defaultScheduledFunnelBundleValidator(),
    clockValue,
    [],
    defaultScheduledFunnelBundleEngine(flagsValue),
  );
}
