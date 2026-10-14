import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptivePayoutQuotaEngine, defaultAdaptivePayoutQuotaEngine } from "./adaptive-payout-quota-engine.js";
import { AdaptivePayoutQuotaValidator, defaultAdaptivePayoutQuotaValidator } from "./adaptive-payout-quota-rules.js";
import { AdaptivePayoutQuotaStore } from "./adaptive-payout-quota-store.js";

/** Moves adaptive payout quotas through their life cycle and keeps a journal of what it did. */
export class AdaptivePayoutQuotaService {
  store: AdaptivePayoutQuotaStore;
  validator: AdaptivePayoutQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePayoutQuotaEngine;

  constructor(
    store: AdaptivePayoutQuotaStore,
    validator: AdaptivePayoutQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePayoutQuotaEngine,
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
      throw new Error(`adaptive payout quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive payout quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive payout quota ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newAdaptivePayoutQuotaService(store: AdaptivePayoutQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptivePayoutQuotaService {
  return new AdaptivePayoutQuotaService(
    store,
    defaultAdaptivePayoutQuotaValidator(),
    clockValue,
    [],
    defaultAdaptivePayoutQuotaEngine(flagsValue),
  );
}
