import * as clock from "../../../../kit/clock.js";
import { LegacyReputationQuotaEngine, defaultLegacyReputationQuotaEngine } from "./legacy-reputation-quota-engine.js";
import {
  LegacyReputationQuotaValidator,
  defaultLegacyReputationQuotaValidator,
} from "./legacy-reputation-quota-rules.js";
import { LegacyReputationQuotaStore } from "./legacy-reputation-quota-store.js";

/** Moves legacy reputation quotas through their life cycle and keeps a journal of what it did. */
export class LegacyReputationQuotaCoordinator {
  store: LegacyReputationQuotaStore;
  validator: LegacyReputationQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyReputationQuotaEngine;

  constructor(
    store: LegacyReputationQuotaStore,
    validator: LegacyReputationQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyReputationQuotaEngine,
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
      throw new Error(`legacy reputation quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reputation quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reputation quota ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLegacyReputationQuotaCoordinator(store: LegacyReputationQuotaStore, clockValue: clock.Clock): LegacyReputationQuotaCoordinator {
  return new LegacyReputationQuotaCoordinator(
    store,
    defaultLegacyReputationQuotaValidator(),
    clockValue,
    [],
    defaultLegacyReputationQuotaEngine(),
  );
}
