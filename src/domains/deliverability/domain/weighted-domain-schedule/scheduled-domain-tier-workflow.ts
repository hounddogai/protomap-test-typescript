import * as clock from "../../../../kit/clock.js";
import { ScheduledDomainTierEngine, defaultScheduledDomainTierEngine } from "./scheduled-domain-tier-engine.js";
import { ScheduledDomainTierValidator, defaultScheduledDomainTierValidator } from "./scheduled-domain-tier-rules.js";
import { ScheduledDomainTierStore } from "./scheduled-domain-tier-store.js";

/** Moves scheduled domain tiers through their life cycle and keeps a journal of what it did. */
export class ScheduledDomainTierService {
  store: ScheduledDomainTierStore;
  validator: ScheduledDomainTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledDomainTierEngine;

  constructor(
    store: ScheduledDomainTierStore,
    validator: ScheduledDomainTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledDomainTierEngine,
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
      throw new Error(`scheduled domain tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled domain tier ${code} not found`);
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
      throw new Error(`scheduled domain tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newScheduledDomainTierService(store: ScheduledDomainTierStore, clockValue: clock.Clock): ScheduledDomainTierService {
  return new ScheduledDomainTierService(
    store,
    defaultScheduledDomainTierValidator(),
    clockValue,
    [],
    defaultScheduledDomainTierEngine(),
  );
}
