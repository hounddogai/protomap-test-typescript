import * as clock from "../../../../kit/clock.js";
import { PacingVarianceEngine, defaultPacingVarianceEngine } from "./pacing-variance-engine.js";
import { PacingVarianceValidator, defaultPacingVarianceValidator } from "./pacing-variance-rules.js";
import { PacingVarianceStore } from "./pacing-variance-store.js";

/** Moves pacing variances through their life cycle and keeps a journal of what it did. */
export class PacingVarianceDesk {
  store: PacingVarianceStore;
  validator: PacingVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingVarianceEngine;

  constructor(
    store: PacingVarianceStore,
    validator: PacingVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingVarianceEngine,
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
      throw new Error(`pacing variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing variance ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPacingVarianceDesk(store: PacingVarianceStore, clockValue: clock.Clock): PacingVarianceDesk {
  return new PacingVarianceDesk(store, defaultPacingVarianceValidator(), clockValue, [], defaultPacingVarianceEngine());
}
