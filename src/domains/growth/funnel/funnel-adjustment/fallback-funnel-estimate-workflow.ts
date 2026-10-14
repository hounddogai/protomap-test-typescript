import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackFunnelEstimateEngine,
  defaultFallbackFunnelEstimateEngine,
} from "./fallback-funnel-estimate-engine.js";
import {
  FallbackFunnelEstimateValidator,
  defaultFallbackFunnelEstimateValidator,
} from "./fallback-funnel-estimate-rules.js";
import { FallbackFunnelEstimateStore } from "./fallback-funnel-estimate-store.js";

/** Moves fallback funnel estimates through their life cycle and keeps a journal of what it did. */
export class FallbackFunnelEstimateManager {
  store: FallbackFunnelEstimateStore;
  validator: FallbackFunnelEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackFunnelEstimateEngine;

  constructor(
    store: FallbackFunnelEstimateStore,
    validator: FallbackFunnelEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackFunnelEstimateEngine,
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
      throw new Error(`fallback funnel estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback funnel estimate ${code} not found`);
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
      throw new Error(`fallback funnel estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackFunnelEstimateManager(store: FallbackFunnelEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackFunnelEstimateManager {
  return new FallbackFunnelEstimateManager(
    store,
    defaultFallbackFunnelEstimateValidator(),
    clockValue,
    [],
    defaultFallbackFunnelEstimateEngine(flagsValue),
  );
}
