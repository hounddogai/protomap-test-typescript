import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeAssignmentEngine, defaultCreativeAssignmentEngine } from "./creative-assignment-engine.js";
import { CreativeAssignmentValidator, defaultCreativeAssignmentValidator } from "./creative-assignment-rules.js";
import { CreativeAssignmentStore } from "./creative-assignment-store.js";

/** Moves creative assignments through their life cycle and keeps a journal of what it did. */
export class CreativeAssignmentDesk {
  store: CreativeAssignmentStore;
  validator: CreativeAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeAssignmentEngine;

  constructor(
    store: CreativeAssignmentStore,
    validator: CreativeAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeAssignmentEngine,
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
      throw new Error(`creative assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative assignment ${code} not found`);
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

export function newCreativeAssignmentDesk(store: CreativeAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeAssignmentDesk {
  return new CreativeAssignmentDesk(
    store,
    defaultCreativeAssignmentValidator(),
    clockValue,
    [],
    defaultCreativeAssignmentEngine(flagsValue),
  );
}
