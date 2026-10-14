import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryPostSnapshotEngine, defaultPrimaryPostSnapshotEngine } from "./primary-post-snapshot-engine.js";
import { PrimaryPostSnapshotValidator, defaultPrimaryPostSnapshotValidator } from "./primary-post-snapshot-rules.js";
import { PrimaryPostSnapshotStore } from "./primary-post-snapshot-store.js";

/** Moves primary post snapshots through their life cycle and keeps a journal of what it did. */
export class PrimaryPostSnapshotCoordinator {
  store: PrimaryPostSnapshotStore;
  validator: PrimaryPostSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryPostSnapshotEngine;

  constructor(
    store: PrimaryPostSnapshotStore,
    validator: PrimaryPostSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryPostSnapshotEngine,
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
      throw new Error(`primary post snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary post snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary post snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryPostSnapshotCoordinator(store: PrimaryPostSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryPostSnapshotCoordinator {
  return new PrimaryPostSnapshotCoordinator(
    store,
    defaultPrimaryPostSnapshotValidator(),
    clockValue,
    [],
    defaultPrimaryPostSnapshotEngine(flagsValue),
  );
}
