import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedTicketViewClaimEngine,
  defaultBatchedTicketViewClaimEngine,
} from "./batched-ticket-view-claim-engine.js";
import {
  BatchedTicketViewClaimValidator,
  defaultBatchedTicketViewClaimValidator,
} from "./batched-ticket-view-claim-rules.js";
import { BatchedTicketViewClaimStore } from "./batched-ticket-view-claim-store.js";

/** Moves batched ticket view claims through their life cycle and keeps a journal of what it did. */
export class BatchedTicketViewClaimCoordinator {
  store: BatchedTicketViewClaimStore;
  validator: BatchedTicketViewClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedTicketViewClaimEngine;

  constructor(
    store: BatchedTicketViewClaimStore,
    validator: BatchedTicketViewClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedTicketViewClaimEngine,
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
      throw new Error(`batched ticket view claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched ticket view claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched ticket view claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedTicketViewClaimCoordinator(store: BatchedTicketViewClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedTicketViewClaimCoordinator {
  return new BatchedTicketViewClaimCoordinator(
    store,
    defaultBatchedTicketViewClaimValidator(),
    clockValue,
    [],
    defaultBatchedTicketViewClaimEngine(flagsValue),
  );
}
