import * as clock from "../../../../kit/clock.js";
import {
  SeasonalTouchpointCheckpointValidator,
  defaultSeasonalTouchpointCheckpointValidator,
} from "./seasonal-touchpoint-checkpoint-rules.js";
import { SeasonalTouchpointCheckpointStore } from "./seasonal-touchpoint-checkpoint-store.js";

/** Moves seasonal touchpoint checkpoints through their life cycle and keeps a journal of what it did. */
export class SeasonalTouchpointCheckpointManager {
  store: SeasonalTouchpointCheckpointStore;
  validator: SeasonalTouchpointCheckpointValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalTouchpointCheckpointStore,
    validator: SeasonalTouchpointCheckpointValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal touchpoint checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal touchpoint checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newSeasonalTouchpointCheckpointManager(store: SeasonalTouchpointCheckpointStore, clockValue: clock.Clock): SeasonalTouchpointCheckpointManager {
  return new SeasonalTouchpointCheckpointManager(store, defaultSeasonalTouchpointCheckpointValidator(), clockValue, []);
}
