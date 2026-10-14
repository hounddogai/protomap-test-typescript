import * as clock from "../../../../kit/clock.js";
import { SlaSnapshotEngine, defaultSlaSnapshotEngine } from "./sla-snapshot-engine.js";
import { SlaSnapshotValidator, defaultSlaSnapshotValidator } from "./sla-snapshot-rules.js";
import { SlaSnapshotStore } from "./sla-snapshot-store.js";

/** Moves sla snapshots through their life cycle and keeps a journal of what it did. */
export class SlaSnapshotWorkflow {
  store: SlaSnapshotStore;
  validator: SlaSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaSnapshotEngine;

  constructor(
    store: SlaSnapshotStore,
    validator: SlaSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaSnapshotEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSlaSnapshotWorkflow(store: SlaSnapshotStore, clockValue: clock.Clock): SlaSnapshotWorkflow {
  return new SlaSnapshotWorkflow(store, defaultSlaSnapshotValidator(), clockValue, [], defaultSlaSnapshotEngine());
}
