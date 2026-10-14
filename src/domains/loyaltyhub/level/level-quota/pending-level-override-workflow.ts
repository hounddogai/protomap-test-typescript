import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingLevelOverrideEngine, defaultPendingLevelOverrideEngine } from "./pending-level-override-engine.js";
import {
  PendingLevelOverrideValidator,
  defaultPendingLevelOverrideValidator,
} from "./pending-level-override-rules.js";
import { PendingLevelOverrideStore } from "./pending-level-override-store.js";

/** Moves pending level overrides through their life cycle and keeps a journal of what it did. */
export class PendingLevelOverrideService {
  store: PendingLevelOverrideStore;
  validator: PendingLevelOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingLevelOverrideEngine;

  constructor(
    store: PendingLevelOverrideStore,
    validator: PendingLevelOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingLevelOverrideEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending level override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending level override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending level override ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPendingLevelOverrideService(store: PendingLevelOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingLevelOverrideService {
  return new PendingLevelOverrideService(
    store,
    defaultPendingLevelOverrideValidator(),
    clockValue,
    [],
    defaultPendingLevelOverrideEngine(flagsValue),
  );
}
