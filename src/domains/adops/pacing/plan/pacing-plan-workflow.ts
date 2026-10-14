import * as clock from "../../../../kit/clock.js";
import { PacingPlanEngine, defaultPacingPlanEngine } from "./pacing-plan-engine.js";
import { PacingPlanValidator, defaultPacingPlanValidator } from "./pacing-plan-rules.js";
import { PacingPlanStore } from "./pacing-plan-store.js";

/** Moves pacing plans through their life cycle and keeps a journal of what it did. */
export class PacingPlanService {
  store: PacingPlanStore;
  validator: PacingPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingPlanEngine;

  constructor(
    store: PacingPlanStore,
    validator: PacingPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingPlanEngine,
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
      throw new Error(`pacing plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing plan ${code} not found`);
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
      throw new Error(`pacing plan ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPacingPlanService(store: PacingPlanStore, clockValue: clock.Clock): PacingPlanService {
  return new PacingPlanService(store, defaultPacingPlanValidator(), clockValue, [], defaultPacingPlanEngine());
}
