import * as clock from "../../../../kit/clock.js";
import { PacingAgreementEngine, defaultPacingAgreementEngine } from "./pacing-agreement-engine.js";
import { PacingAgreementValidator, defaultPacingAgreementValidator } from "./pacing-agreement-rules.js";
import { PacingAgreementStore } from "./pacing-agreement-store.js";

/** Moves pacing agreements through their life cycle and keeps a journal of what it did. */
export class PacingAgreementDesk {
  store: PacingAgreementStore;
  validator: PacingAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingAgreementEngine;

  constructor(
    store: PacingAgreementStore,
    validator: PacingAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingAgreementEngine,
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
      throw new Error(`pacing agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing agreement ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPacingAgreementDesk(store: PacingAgreementStore, clockValue: clock.Clock): PacingAgreementDesk {
  return new PacingAgreementDesk(
    store,
    defaultPacingAgreementValidator(),
    clockValue,
    [],
    defaultPacingAgreementEngine(),
  );
}
