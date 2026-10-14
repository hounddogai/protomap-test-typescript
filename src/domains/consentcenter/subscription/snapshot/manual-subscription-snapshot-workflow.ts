import * as clock from "../../../../kit/clock.js";
import {
  ManualSubscriptionSnapshotEngine,
  defaultManualSubscriptionSnapshotEngine,
} from "./manual-subscription-snapshot-engine.js";
import {
  ManualSubscriptionSnapshotValidator,
  defaultManualSubscriptionSnapshotValidator,
} from "./manual-subscription-snapshot-rules.js";
import { ManualSubscriptionSnapshotStore } from "./manual-subscription-snapshot-store.js";

/** Moves manual subscription snapshots through their life cycle and keeps a journal of what it did. */
export class ManualSubscriptionSnapshotWorkflow {
  store: ManualSubscriptionSnapshotStore;
  validator: ManualSubscriptionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualSubscriptionSnapshotEngine;

  constructor(
    store: ManualSubscriptionSnapshotStore,
    validator: ManualSubscriptionSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualSubscriptionSnapshotEngine,
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
      throw new Error(`manual subscription snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription snapshot ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newManualSubscriptionSnapshotWorkflow(store: ManualSubscriptionSnapshotStore, clockValue: clock.Clock): ManualSubscriptionSnapshotWorkflow {
  return new ManualSubscriptionSnapshotWorkflow(
    store,
    defaultManualSubscriptionSnapshotValidator(),
    clockValue,
    [],
    defaultManualSubscriptionSnapshotEngine(),
  );
}
