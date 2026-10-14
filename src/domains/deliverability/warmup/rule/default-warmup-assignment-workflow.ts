import * as clock from "../../../../kit/clock.js";
import {
  DefaultWarmupAssignmentEngine,
  defaultDefaultWarmupAssignmentEngine,
} from "./default-warmup-assignment-engine.js";
import {
  DefaultWarmupAssignmentValidator,
  defaultDefaultWarmupAssignmentValidator,
} from "./default-warmup-assignment-rules.js";
import { DefaultWarmupAssignmentStore } from "./default-warmup-assignment-store.js";

/** Moves default warmup assignments through their life cycle and keeps a journal of what it did. */
export class DefaultWarmupAssignmentDesk {
  store: DefaultWarmupAssignmentStore;
  validator: DefaultWarmupAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultWarmupAssignmentEngine;

  constructor(
    store: DefaultWarmupAssignmentStore,
    validator: DefaultWarmupAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultWarmupAssignmentEngine,
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
      throw new Error(`default warmup assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default warmup assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default warmup assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newDefaultWarmupAssignmentDesk(store: DefaultWarmupAssignmentStore, clockValue: clock.Clock): DefaultWarmupAssignmentDesk {
  return new DefaultWarmupAssignmentDesk(
    store,
    defaultDefaultWarmupAssignmentValidator(),
    clockValue,
    [],
    defaultDefaultWarmupAssignmentEngine(),
  );
}
