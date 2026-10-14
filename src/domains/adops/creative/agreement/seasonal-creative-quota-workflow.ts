import * as clock from "../../../../kit/clock.js";
import { SeasonalCreativeQuotaEngine, defaultSeasonalCreativeQuotaEngine } from "./seasonal-creative-quota-engine.js";
import {
  SeasonalCreativeQuotaValidator,
  defaultSeasonalCreativeQuotaValidator,
} from "./seasonal-creative-quota-rules.js";
import { SeasonalCreativeQuotaStore } from "./seasonal-creative-quota-store.js";

/** Moves seasonal creative quotas through their life cycle and keeps a journal of what it did. */
export class SeasonalCreativeQuotaWorkflow {
  store: SeasonalCreativeQuotaStore;
  validator: SeasonalCreativeQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalCreativeQuotaEngine;

  constructor(
    store: SeasonalCreativeQuotaStore,
    validator: SeasonalCreativeQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalCreativeQuotaEngine,
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
      throw new Error(`seasonal creative quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal creative quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal creative quota ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalCreativeQuotaWorkflow(store: SeasonalCreativeQuotaStore, clockValue: clock.Clock): SeasonalCreativeQuotaWorkflow {
  return new SeasonalCreativeQuotaWorkflow(
    store,
    defaultSeasonalCreativeQuotaValidator(),
    clockValue,
    [],
    defaultSeasonalCreativeQuotaEngine(),
  );
}
