import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SlaQuotaEngine, defaultSlaQuotaEngine } from "./sla-quota-engine.js";
import { SlaQuotaValidator, defaultSlaQuotaValidator } from "./sla-quota-rules.js";
import { SlaQuotaStore } from "./sla-quota-store.js";

/** Moves sla quotas through their life cycle and keeps a journal of what it did. */
export class SlaQuotaCoordinator {
  store: SlaQuotaStore;
  validator: SlaQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaQuotaEngine;

  constructor(
    store: SlaQuotaStore,
    validator: SlaQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaQuotaEngine,
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
      throw new Error(`sla quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla quota ${code} not found`);
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
      throw new Error(`sla quota ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newSlaQuotaCoordinator(store: SlaQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): SlaQuotaCoordinator {
  return new SlaQuotaCoordinator(store, defaultSlaQuotaValidator(), clockValue, [], defaultSlaQuotaEngine(flagsValue));
}
