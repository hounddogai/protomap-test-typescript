import * as clock from "../../../../kit/clock.js";
import { SlaRequestEngine, defaultSlaRequestEngine } from "./sla-request-engine.js";
import { SlaRequestValidator, defaultSlaRequestValidator } from "./sla-request-rules.js";
import { SlaRequestStore } from "./sla-request-store.js";

/** Moves sla requests through their life cycle and keeps a journal of what it did. */
export class SlaRequestDesk {
  store: SlaRequestStore;
  validator: SlaRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaRequestEngine;

  constructor(
    store: SlaRequestStore,
    validator: SlaRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaRequestEngine,
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
      throw new Error(`sla request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla request ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaRequestDesk(store: SlaRequestStore, clockValue: clock.Clock): SlaRequestDesk {
  return new SlaRequestDesk(store, defaultSlaRequestValidator(), clockValue, [], defaultSlaRequestEngine());
}
