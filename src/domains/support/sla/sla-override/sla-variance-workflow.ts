import * as clock from "../../../../kit/clock.js";
import { SlaVarianceEngine, defaultSlaVarianceEngine } from "./sla-variance-engine.js";
import { SlaVarianceValidator, defaultSlaVarianceValidator } from "./sla-variance-rules.js";
import { SlaVarianceStore } from "./sla-variance-store.js";

/** Moves sla variances through their life cycle and keeps a journal of what it did. */
export class SlaVarianceDesk {
  store: SlaVarianceStore;
  validator: SlaVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaVarianceEngine;

  constructor(
    store: SlaVarianceStore,
    validator: SlaVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaVarianceEngine,
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
      throw new Error(`sla variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla variance ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newSlaVarianceDesk(store: SlaVarianceStore, clockValue: clock.Clock): SlaVarianceDesk {
  return new SlaVarianceDesk(store, defaultSlaVarianceValidator(), clockValue, [], defaultSlaVarianceEngine());
}
