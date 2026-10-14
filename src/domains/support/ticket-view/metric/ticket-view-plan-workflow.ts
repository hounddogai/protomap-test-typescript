import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TicketViewPlanEngine, defaultTicketViewPlanEngine } from "./ticket-view-plan-engine.js";
import { TicketViewPlanValidator, defaultTicketViewPlanValidator } from "./ticket-view-plan-rules.js";
import { TicketViewPlanStore } from "./ticket-view-plan-store.js";

/** Moves ticket view plans through their life cycle and keeps a journal of what it did. */
export class TicketViewPlanWorkflow {
  store: TicketViewPlanStore;
  validator: TicketViewPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewPlanEngine;

  constructor(
    store: TicketViewPlanStore,
    validator: TicketViewPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewPlanEngine,
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
      throw new Error(`ticket view plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view plan ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newTicketViewPlanWorkflow(store: TicketViewPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): TicketViewPlanWorkflow {
  return new TicketViewPlanWorkflow(
    store,
    defaultTicketViewPlanValidator(),
    clockValue,
    [],
    defaultTicketViewPlanEngine(flagsValue),
  );
}
