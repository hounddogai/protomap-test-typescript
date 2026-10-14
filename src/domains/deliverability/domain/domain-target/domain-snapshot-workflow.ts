import * as clock from "../../../../kit/clock.js";
import { DomainSnapshotEngine, defaultDomainSnapshotEngine } from "./domain-snapshot-engine.js";
import { DomainSnapshotValidator, defaultDomainSnapshotValidator } from "./domain-snapshot-rules.js";
import { DomainSnapshotStore } from "./domain-snapshot-store.js";

/** Moves domain snapshots through their life cycle and keeps a journal of what it did. */
export class DomainSnapshotDesk {
  store: DomainSnapshotStore;
  validator: DomainSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DomainSnapshotEngine;

  constructor(
    store: DomainSnapshotStore,
    validator: DomainSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DomainSnapshotEngine,
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
      throw new Error(`domain snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`domain snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`domain snapshot ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newDomainSnapshotDesk(store: DomainSnapshotStore, clockValue: clock.Clock): DomainSnapshotDesk {
  return new DomainSnapshotDesk(store, defaultDomainSnapshotValidator(), clockValue, [], defaultDomainSnapshotEngine());
}
