import * as clock from "../../../../kit/clock.js";
import { OptOutQuotaEngine, defaultOptOutQuotaEngine } from "./opt-out-quota-engine.js";
import { OptOutQuotaValidator, defaultOptOutQuotaValidator } from "./opt-out-quota-rules.js";
import { OptOutQuotaStore } from "./opt-out-quota-store.js";

/** Moves opt out quotas through their life cycle and keeps a journal of what it did. */
export class OptOutQuotaService {
  store: OptOutQuotaStore;
  validator: OptOutQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutQuotaEngine;

  constructor(
    store: OptOutQuotaStore,
    validator: OptOutQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutQuotaEngine,
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
      throw new Error(`opt out quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newOptOutQuotaService(store: OptOutQuotaStore, clockValue: clock.Clock): OptOutQuotaService {
  return new OptOutQuotaService(store, defaultOptOutQuotaValidator(), clockValue, [], defaultOptOutQuotaEngine());
}
