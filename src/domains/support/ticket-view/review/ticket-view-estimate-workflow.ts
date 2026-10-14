import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TicketViewEstimateEngine, defaultTicketViewEstimateEngine } from "./ticket-view-estimate-engine.js";
import { TicketViewEstimateValidator, defaultTicketViewEstimateValidator } from "./ticket-view-estimate-rules.js";
import { TicketViewEstimateStore } from "./ticket-view-estimate-store.js";

/** Moves ticket view estimates through their life cycle and keeps a journal of what it did. */
export class TicketViewEstimateService {
  store: TicketViewEstimateStore;
  validator: TicketViewEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewEstimateEngine;

  constructor(
    store: TicketViewEstimateStore,
    validator: TicketViewEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewEstimateEngine,
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
      throw new Error(`ticket view estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view estimate ${code} not found`);
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
      throw new Error(`ticket view estimate ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newTicketViewEstimateService(store: TicketViewEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): TicketViewEstimateService {
  return new TicketViewEstimateService(
    store,
    defaultTicketViewEstimateValidator(),
    clockValue,
    [],
    defaultTicketViewEstimateEngine(flagsValue),
  );
}
