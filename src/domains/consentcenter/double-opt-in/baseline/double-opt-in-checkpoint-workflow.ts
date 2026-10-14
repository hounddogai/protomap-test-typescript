import * as clock from "../../../../kit/clock.js";
import {
  DoubleOptInCheckpointValidator,
  defaultDoubleOptInCheckpointValidator,
} from "./double-opt-in-checkpoint-rules.js";
import { DoubleOptInCheckpointStore } from "./double-opt-in-checkpoint-store.js";

/** Moves double opt in checkpoints through their life cycle and keeps a journal of what it did. */
export class DoubleOptInCheckpointService {
  store: DoubleOptInCheckpointStore;
  validator: DoubleOptInCheckpointValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DoubleOptInCheckpointStore,
    validator: DoubleOptInCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newDoubleOptInCheckpointService(store: DoubleOptInCheckpointStore, clockValue: clock.Clock): DoubleOptInCheckpointService {
  return new DoubleOptInCheckpointService(store, defaultDoubleOptInCheckpointValidator(), clockValue, []);
}
