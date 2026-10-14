import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EscalationAgreementEngine, defaultEscalationAgreementEngine } from "./escalation-agreement-engine.js";
import { EscalationAgreementValidator, defaultEscalationAgreementValidator } from "./escalation-agreement-rules.js";
import { EscalationAgreementStore } from "./escalation-agreement-store.js";

/** Moves escalation agreements through their life cycle and keeps a journal of what it did. */
export class EscalationAgreementDesk {
  store: EscalationAgreementStore;
  validator: EscalationAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationAgreementEngine;

  constructor(
    store: EscalationAgreementStore,
    validator: EscalationAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationAgreementEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation agreement ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newEscalationAgreementDesk(store: EscalationAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): EscalationAgreementDesk {
  return new EscalationAgreementDesk(
    store,
    defaultEscalationAgreementValidator(),
    clockValue,
    [],
    defaultEscalationAgreementEngine(flagsValue),
  );
}
