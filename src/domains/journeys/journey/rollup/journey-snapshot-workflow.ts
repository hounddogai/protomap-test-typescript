import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { JourneySnapshotEngine, defaultJourneySnapshotEngine } from "./journey-snapshot-engine.js";
import { JourneySnapshotValidator, defaultJourneySnapshotValidator } from "./journey-snapshot-rules.js";
import { JourneySnapshotStore } from "./journey-snapshot-store.js";

/** Moves journey snapshots through their life cycle and keeps a journal of what it did. */
export class JourneySnapshotWorkflow {
  store: JourneySnapshotStore;
  validator: JourneySnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneySnapshotEngine;

  constructor(
    store: JourneySnapshotStore,
    validator: JourneySnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneySnapshotEngine,
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
      throw new Error(`journey snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey snapshot ${code} not found`);
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
      throw new Error(`journey snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newJourneySnapshotWorkflow(store: JourneySnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): JourneySnapshotWorkflow {
  return new JourneySnapshotWorkflow(
    store,
    defaultJourneySnapshotValidator(),
    clockValue,
    [],
    defaultJourneySnapshotEngine(flagsValue),
  );
}
