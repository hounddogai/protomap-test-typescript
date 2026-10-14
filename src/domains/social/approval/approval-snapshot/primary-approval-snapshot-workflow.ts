import * as clock from "../../../../kit/clock.js";
import {
  PrimaryApprovalSnapshotEngine,
  defaultPrimaryApprovalSnapshotEngine,
} from "./primary-approval-snapshot-engine.js";
import {
  PrimaryApprovalSnapshotValidator,
  defaultPrimaryApprovalSnapshotValidator,
} from "./primary-approval-snapshot-rules.js";
import { PrimaryApprovalSnapshotStore } from "./primary-approval-snapshot-store.js";

/** Moves primary approval snapshots through their life cycle and keeps a journal of what it did. */
export class PrimaryApprovalSnapshotManager {
  store: PrimaryApprovalSnapshotStore;
  validator: PrimaryApprovalSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryApprovalSnapshotEngine;

  constructor(
    store: PrimaryApprovalSnapshotStore,
    validator: PrimaryApprovalSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryApprovalSnapshotEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary approval snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary approval snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary approval snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPrimaryApprovalSnapshotManager(store: PrimaryApprovalSnapshotStore, clockValue: clock.Clock): PrimaryApprovalSnapshotManager {
  return new PrimaryApprovalSnapshotManager(
    store,
    defaultPrimaryApprovalSnapshotValidator(),
    clockValue,
    [],
    defaultPrimaryApprovalSnapshotEngine(),
  );
}
