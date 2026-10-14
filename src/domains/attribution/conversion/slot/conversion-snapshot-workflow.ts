import * as clock from "../../../../kit/clock.js";
import { ConversionSnapshotValidator, defaultConversionSnapshotValidator } from "./conversion-snapshot-rules.js";
import { ConversionSnapshotStore } from "./conversion-snapshot-store.js";

/** Moves conversion snapshots through their life cycle and keeps a journal of what it did. */
export class ConversionSnapshotService {
  store: ConversionSnapshotStore;
  validator: ConversionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ConversionSnapshotStore,
    validator: ConversionSnapshotValidator,
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
      throw new Error(`conversion snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion snapshot ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newConversionSnapshotService(store: ConversionSnapshotStore, clockValue: clock.Clock): ConversionSnapshotService {
  return new ConversionSnapshotService(store, defaultConversionSnapshotValidator(), clockValue, []);
}
