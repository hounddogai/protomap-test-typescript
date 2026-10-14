import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SubscriptionSnapshotEngine, defaultSubscriptionSnapshotEngine } from "./subscription-snapshot-engine.js";
import {
  SubscriptionSnapshotValidator,
  defaultSubscriptionSnapshotValidator,
} from "./subscription-snapshot-rules.js";
import { SubscriptionSnapshotStore } from "./subscription-snapshot-store.js";

/** Moves subscription snapshots through their life cycle and keeps a journal of what it did. */
export class SubscriptionSnapshotDesk {
  store: SubscriptionSnapshotStore;
  validator: SubscriptionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionSnapshotEngine;

  constructor(
    store: SubscriptionSnapshotStore,
    validator: SubscriptionSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionSnapshotEngine,
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
      throw new Error(`subscription snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription snapshot ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSubscriptionSnapshotDesk(store: SubscriptionSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionSnapshotDesk {
  return new SubscriptionSnapshotDesk(
    store,
    defaultSubscriptionSnapshotValidator(),
    clockValue,
    [],
    defaultSubscriptionSnapshotEngine(flagsValue),
  );
}
