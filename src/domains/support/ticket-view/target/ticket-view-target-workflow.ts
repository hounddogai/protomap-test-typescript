import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TicketViewTargetEngine, defaultTicketViewTargetEngine } from "./ticket-view-target-engine.js";
import { TicketViewTargetValidator, defaultTicketViewTargetValidator } from "./ticket-view-target-rules.js";
import { TicketViewTargetStore } from "./ticket-view-target-store.js";

/** Moves ticket view targets through their life cycle and keeps a journal of what it did. */
export class TicketViewTargetCoordinator {
  store: TicketViewTargetStore;
  validator: TicketViewTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewTargetEngine;

  constructor(
    store: TicketViewTargetStore,
    validator: TicketViewTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewTargetEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view target ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTicketViewTargetCoordinator(store: TicketViewTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): TicketViewTargetCoordinator {
  return new TicketViewTargetCoordinator(
    store,
    defaultTicketViewTargetValidator(),
    clockValue,
    [],
    defaultTicketViewTargetEngine(flagsValue),
  );
}
