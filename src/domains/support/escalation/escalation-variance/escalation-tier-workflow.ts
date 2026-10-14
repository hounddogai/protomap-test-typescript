import * as clock from "../../../../kit/clock.js";
import { EscalationTierEngine, defaultEscalationTierEngine } from "./escalation-tier-engine.js";
import { EscalationTierValidator, defaultEscalationTierValidator } from "./escalation-tier-rules.js";
import { EscalationTierStore } from "./escalation-tier-store.js";

/** Moves escalation tiers through their life cycle and keeps a journal of what it did. */
export class EscalationTierDesk {
  store: EscalationTierStore;
  validator: EscalationTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationTierEngine;

  constructor(
    store: EscalationTierStore,
    validator: EscalationTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationTierEngine,
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
      throw new Error(`escalation tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation tier ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newEscalationTierDesk(store: EscalationTierStore, clockValue: clock.Clock): EscalationTierDesk {
  return new EscalationTierDesk(store, defaultEscalationTierValidator(), clockValue, [], defaultEscalationTierEngine());
}
