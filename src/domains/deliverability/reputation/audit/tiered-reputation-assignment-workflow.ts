import * as clock from "../../../../kit/clock.js";
import {
  TieredReputationAssignmentValidator,
  defaultTieredReputationAssignmentValidator,
} from "./tiered-reputation-assignment-rules.js";
import { TieredReputationAssignmentStore } from "./tiered-reputation-assignment-store.js";

/** Moves tiered reputation assignments through their life cycle and keeps a journal of what it did. */
export class TieredReputationAssignmentService {
  store: TieredReputationAssignmentStore;
  validator: TieredReputationAssignmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredReputationAssignmentStore,
    validator: TieredReputationAssignmentValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reputation assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reputation assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredReputationAssignmentService(store: TieredReputationAssignmentStore, clockValue: clock.Clock): TieredReputationAssignmentService {
  return new TieredReputationAssignmentService(store, defaultTieredReputationAssignmentValidator(), clockValue, []);
}
