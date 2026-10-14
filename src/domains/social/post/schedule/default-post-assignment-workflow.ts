import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultPostAssignmentEngineExtra,
  defaultDefaultPostAssignmentEngine,
} from "./default-post-assignment-engine.js";
import {
  DefaultPostAssignmentValidatorExtra,
  defaultDefaultPostAssignmentValidator,
} from "./default-post-assignment-rules.js";
import { DefaultPostAssignmentStore } from "./default-post-assignment-store.js";

/** Moves default post assignments through their life cycle and keeps a journal of what it did. */
export class DefaultPostAssignmentManager {
  store: DefaultPostAssignmentStore;
  validator: DefaultPostAssignmentValidatorExtra;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPostAssignmentEngineExtra;

  constructor(
    store: DefaultPostAssignmentStore,
    validator: DefaultPostAssignmentValidatorExtra,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPostAssignmentEngineExtra,
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
      throw new Error(`default post assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default post assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default post assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultPostAssignmentManager(store: DefaultPostAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultPostAssignmentManager {
  return new DefaultPostAssignmentManager(
    store,
    defaultDefaultPostAssignmentValidator(),
    clockValue,
    [],
    defaultDefaultPostAssignmentEngine(flagsValue),
  );
}
