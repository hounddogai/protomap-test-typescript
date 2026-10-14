import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveFlightSnapshotValidator,
  defaultAdaptiveFlightSnapshotValidator,
} from "./adaptive-flight-snapshot-rules.js";
import { AdaptiveFlightSnapshotStore } from "./adaptive-flight-snapshot-store.js";

/** Moves adaptive flight snapshots through their life cycle and keeps a journal of what it did. */
export class AdaptiveFlightSnapshotCoordinator {
  store: AdaptiveFlightSnapshotStore;
  validator: AdaptiveFlightSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveFlightSnapshotStore,
    validator: AdaptiveFlightSnapshotValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive flight snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive flight snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveFlightSnapshotCoordinator(store: AdaptiveFlightSnapshotStore, clockValue: clock.Clock): AdaptiveFlightSnapshotCoordinator {
  return new AdaptiveFlightSnapshotCoordinator(store, defaultAdaptiveFlightSnapshotValidator(), clockValue, []);
}
