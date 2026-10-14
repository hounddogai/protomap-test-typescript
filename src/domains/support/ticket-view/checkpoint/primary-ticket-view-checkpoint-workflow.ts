import * as clock from "../../../../kit/clock.js";
import {
  PrimaryTicketViewCheckpointEngine,
  defaultPrimaryTicketViewCheckpointEngine,
} from "./primary-ticket-view-checkpoint-engine.js";
import {
  PrimaryTicketViewCheckpointValidator,
  defaultPrimaryTicketViewCheckpointValidator,
} from "./primary-ticket-view-checkpoint-rules.js";
import { PrimaryTicketViewCheckpointStore } from "./primary-ticket-view-checkpoint-store.js";

/** Moves primary ticket view checkpoints through their life cycle and keeps a journal of what it did. */
export class PrimaryTicketViewCheckpointService {
  store: PrimaryTicketViewCheckpointStore;
  validator: PrimaryTicketViewCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryTicketViewCheckpointEngine;

  constructor(
    store: PrimaryTicketViewCheckpointStore,
    validator: PrimaryTicketViewCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryTicketViewCheckpointEngine,
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
      throw new Error(`primary ticket view checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary ticket view checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary ticket view checkpoint ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPrimaryTicketViewCheckpointService(store: PrimaryTicketViewCheckpointStore, clockValue: clock.Clock): PrimaryTicketViewCheckpointService {
  return new PrimaryTicketViewCheckpointService(
    store,
    defaultPrimaryTicketViewCheckpointValidator(),
    clockValue,
    [],
    defaultPrimaryTicketViewCheckpointEngine(),
  );
}
