import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacySenderAssignmentEngine,
  defaultLegacySenderAssignmentEngine,
} from "./legacy-sender-assignment-engine.js";
import {
  LegacySenderAssignmentValidator,
  defaultLegacySenderAssignmentValidator,
} from "./legacy-sender-assignment-rules.js";
import { LegacySenderAssignmentStore } from "./legacy-sender-assignment-store.js";

/** Moves legacy sender assignments through their life cycle and keeps a journal of what it did. */
export class LegacySenderAssignmentService {
  store: LegacySenderAssignmentStore;
  validator: LegacySenderAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacySenderAssignmentEngine;

  constructor(
    store: LegacySenderAssignmentStore,
    validator: LegacySenderAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacySenderAssignmentEngine,
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
      throw new Error(`legacy sender assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy sender assignment ${code} not found`);
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
      throw new Error(`legacy sender assignment ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLegacySenderAssignmentService(store: LegacySenderAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacySenderAssignmentService {
  return new LegacySenderAssignmentService(
    store,
    defaultLegacySenderAssignmentValidator(),
    clockValue,
    [],
    defaultLegacySenderAssignmentEngine(flagsValue),
  );
}
