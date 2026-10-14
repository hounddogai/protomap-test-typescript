import * as clock from "../../../../kit/clock.js";
import { LenientPostSnapshotValidator, defaultLenientPostSnapshotValidator } from "./lenient-post-snapshot-rules.js";
import { LenientPostSnapshotStore } from "./lenient-post-snapshot-store.js";

/** Moves lenient post snapshots through their life cycle and keeps a journal of what it did. */
export class LenientPostSnapshotCoordinator {
  store: LenientPostSnapshotStore;
  validator: LenientPostSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientPostSnapshotStore,
    validator: LenientPostSnapshotValidator,
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
      throw new Error(`lenient post snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient post snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newLenientPostSnapshotCoordinator(store: LenientPostSnapshotStore, clockValue: clock.Clock): LenientPostSnapshotCoordinator {
  return new LenientPostSnapshotCoordinator(store, defaultLenientPostSnapshotValidator(), clockValue, []);
}
