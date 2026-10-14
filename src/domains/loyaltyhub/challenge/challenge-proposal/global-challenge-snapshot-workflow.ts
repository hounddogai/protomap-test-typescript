import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalChallengeSnapshotEngine,
  defaultGlobalChallengeSnapshotEngine,
} from "./global-challenge-snapshot-engine.js";
import {
  GlobalChallengeSnapshotValidator,
  defaultGlobalChallengeSnapshotValidator,
} from "./global-challenge-snapshot-rules.js";
import { GlobalChallengeSnapshotStore } from "./global-challenge-snapshot-store.js";

/** Moves global challenge snapshots through their life cycle and keeps a journal of what it did. */
export class GlobalChallengeSnapshotWorkflow {
  store: GlobalChallengeSnapshotStore;
  validator: GlobalChallengeSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalChallengeSnapshotEngine;

  constructor(
    store: GlobalChallengeSnapshotStore,
    validator: GlobalChallengeSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalChallengeSnapshotEngine,
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
      throw new Error(`global challenge snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global challenge snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global challenge snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalChallengeSnapshotWorkflow(store: GlobalChallengeSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalChallengeSnapshotWorkflow {
  return new GlobalChallengeSnapshotWorkflow(
    store,
    defaultGlobalChallengeSnapshotValidator(),
    clockValue,
    [],
    defaultGlobalChallengeSnapshotEngine(flagsValue),
  );
}
