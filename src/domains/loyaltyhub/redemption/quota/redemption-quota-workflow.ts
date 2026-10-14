import * as clock from "../../../../kit/clock.js";
import { RedemptionQuotaValidator, defaultRedemptionQuotaValidator } from "./redemption-quota-rules.js";
import { RedemptionQuotaStore } from "./redemption-quota-store.js";

/** Moves redemption quotas through their life cycle and keeps a journal of what it did. */
export class RedemptionQuotaService {
  store: RedemptionQuotaStore;
  validator: RedemptionQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RedemptionQuotaStore,
    validator: RedemptionQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newRedemptionQuotaService(store: RedemptionQuotaStore, clockValue: clock.Clock): RedemptionQuotaService {
  return new RedemptionQuotaService(store, defaultRedemptionQuotaValidator(), clockValue, []);
}
