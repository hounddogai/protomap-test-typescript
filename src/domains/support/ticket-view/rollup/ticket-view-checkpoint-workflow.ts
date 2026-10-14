import * as clock from "../../../../kit/clock.js";
import { TicketViewCheckpointEngine, defaultTicketViewCheckpointEngine } from "./ticket-view-checkpoint-engine.js";
import {
  TicketViewCheckpointValidator,
  defaultTicketViewCheckpointValidator,
} from "./ticket-view-checkpoint-rules.js";
import { TicketViewCheckpointStore } from "./ticket-view-checkpoint-store.js";

/** Moves ticket view checkpoints through their life cycle and keeps a journal of what it did. */
export class TicketViewCheckpointService {
  store: TicketViewCheckpointStore;
  validator: TicketViewCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewCheckpointEngine;

  constructor(
    store: TicketViewCheckpointStore,
    validator: TicketViewCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewCheckpointEngine,
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
      throw new Error(`ticket view checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newTicketViewCheckpointService(store: TicketViewCheckpointStore, clockValue: clock.Clock): TicketViewCheckpointService {
  return new TicketViewCheckpointService(
    store,
    defaultTicketViewCheckpointValidator(),
    clockValue,
    [],
    defaultTicketViewCheckpointEngine(),
  );
}
