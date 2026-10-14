import * as clock from "../../../../kit/clock.js";
import {
  PendingTicketViewCheckpointEngine,
  defaultPendingTicketViewCheckpointEngine,
} from "./pending-ticket-view-checkpoint-engine.js";
import {
  PendingTicketViewCheckpointValidator,
  defaultPendingTicketViewCheckpointValidator,
} from "./pending-ticket-view-checkpoint-rules.js";
import { PendingTicketViewCheckpointStore } from "./pending-ticket-view-checkpoint-store.js";

/** Moves pending ticket view checkpoints through their life cycle and keeps a journal of what it did. */
export class PendingTicketViewCheckpointService {
  store: PendingTicketViewCheckpointStore;
  validator: PendingTicketViewCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingTicketViewCheckpointEngine;

  constructor(
    store: PendingTicketViewCheckpointStore,
    validator: PendingTicketViewCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingTicketViewCheckpointEngine,
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
      throw new Error(`pending ticket view checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending ticket view checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending ticket view checkpoint ${code} not found`);
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

export function newPendingTicketViewCheckpointService(store: PendingTicketViewCheckpointStore, clockValue: clock.Clock): PendingTicketViewCheckpointService {
  return new PendingTicketViewCheckpointService(
    store,
    defaultPendingTicketViewCheckpointValidator(),
    clockValue,
    [],
    defaultPendingTicketViewCheckpointEngine(),
  );
}
