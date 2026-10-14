import * as clock from "../../../../kit/clock.js";
import { FraudCheckQuotaValidator, defaultFraudCheckQuotaValidator } from "./fraud-check-quota-rules.js";
import { FraudCheckQuotaStore } from "./fraud-check-quota-store.js";

/** Moves fraud check quotas through their life cycle and keeps a journal of what it did. */
export class FraudCheckQuotaService {
  store: FraudCheckQuotaStore;
  validator: FraudCheckQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FraudCheckQuotaStore,
    validator: FraudCheckQuotaValidator,
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
      throw new Error(`fraud check quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newFraudCheckQuotaService(store: FraudCheckQuotaStore, clockValue: clock.Clock): FraudCheckQuotaService {
  return new FraudCheckQuotaService(store, defaultFraudCheckQuotaValidator(), clockValue, []);
}
