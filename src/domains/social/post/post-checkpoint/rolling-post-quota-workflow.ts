import * as clock from "../../../../kit/clock.js";
import { RollingPostQuotaValidator, defaultRollingPostQuotaValidator } from "./rolling-post-quota-rules.js";
import { RollingPostQuotaStore } from "./rolling-post-quota-store.js";

/** Moves rolling post quotas through their life cycle and keeps a journal of what it did. */
export class RollingPostQuotaService {
  store: RollingPostQuotaStore;
  validator: RollingPostQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingPostQuotaStore,
    validator: RollingPostQuotaValidator,
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
      throw new Error(`rolling post quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling post quota ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingPostQuotaService(store: RollingPostQuotaStore, clockValue: clock.Clock): RollingPostQuotaService {
  return new RollingPostQuotaService(store, defaultRollingPostQuotaValidator(), clockValue, []);
}
