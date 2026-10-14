import * as clock from "../../../../kit/clock.js";
import { ManualBadgeQuotaEngine, defaultManualBadgeQuotaEngine } from "./manual-badge-quota-engine.js";
import { ManualBadgeQuotaValidator, defaultManualBadgeQuotaValidator } from "./manual-badge-quota-rules.js";
import { ManualBadgeQuotaStore } from "./manual-badge-quota-store.js";

/** Moves manual badge quotas through their life cycle and keeps a journal of what it did. */
export class ManualBadgeQuotaService {
  store: ManualBadgeQuotaStore;
  validator: ManualBadgeQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualBadgeQuotaEngine;

  constructor(
    store: ManualBadgeQuotaStore,
    validator: ManualBadgeQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualBadgeQuotaEngine,
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
      throw new Error(`manual badge quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual badge quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual badge quota ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newManualBadgeQuotaService(store: ManualBadgeQuotaStore, clockValue: clock.Clock): ManualBadgeQuotaService {
  return new ManualBadgeQuotaService(
    store,
    defaultManualBadgeQuotaValidator(),
    clockValue,
    [],
    defaultManualBadgeQuotaEngine(),
  );
}
