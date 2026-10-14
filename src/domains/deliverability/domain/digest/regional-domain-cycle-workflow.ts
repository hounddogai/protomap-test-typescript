import * as clock from "../../../../kit/clock.js";
import { RegionalDomainCycleEngine, defaultRegionalDomainCycleEngine } from "./regional-domain-cycle-engine.js";
import { RegionalDomainCycleValidator, defaultRegionalDomainCycleValidator } from "./regional-domain-cycle-rules.js";
import { RegionalDomainCycleStore } from "./regional-domain-cycle-store.js";

/** Moves regional domain cycles through their life cycle and keeps a journal of what it did. */
export class RegionalDomainCycleDesk {
  store: RegionalDomainCycleStore;
  validator: RegionalDomainCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalDomainCycleEngine;

  constructor(
    store: RegionalDomainCycleStore,
    validator: RegionalDomainCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalDomainCycleEngine,
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
      throw new Error(`regional domain cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional domain cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional domain cycle ${code} not found`);
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

export function newRegionalDomainCycleDesk(store: RegionalDomainCycleStore, clockValue: clock.Clock): RegionalDomainCycleDesk {
  return new RegionalDomainCycleDesk(
    store,
    defaultRegionalDomainCycleValidator(),
    clockValue,
    [],
    defaultRegionalDomainCycleEngine(),
  );
}
