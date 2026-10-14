import * as clock from "../../../../kit/clock.js";
import { TieredNudgeSnapshotValidator, defaultTieredNudgeSnapshotValidator } from "./tiered-nudge-snapshot-rules.js";
import { TieredNudgeSnapshotStore } from "./tiered-nudge-snapshot-store.js";

/** Moves tiered nudge snapshots through their life cycle and keeps a journal of what it did. */
export class TieredNudgeSnapshotCoordinator {
  store: TieredNudgeSnapshotStore;
  validator: TieredNudgeSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredNudgeSnapshotStore,
    validator: TieredNudgeSnapshotValidator,
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
      throw new Error(`tiered nudge snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered nudge snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredNudgeSnapshotCoordinator(store: TieredNudgeSnapshotStore, clockValue: clock.Clock): TieredNudgeSnapshotCoordinator {
  return new TieredNudgeSnapshotCoordinator(store, defaultTieredNudgeSnapshotValidator(), clockValue, []);
}
