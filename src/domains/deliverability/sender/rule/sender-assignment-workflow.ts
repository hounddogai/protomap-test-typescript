import * as clock from "../../../../kit/clock.js";
import { SenderAssignmentEngine, defaultSenderAssignmentEngine } from "./sender-assignment-engine.js";
import { SenderAssignmentValidator, defaultSenderAssignmentValidator } from "./sender-assignment-rules.js";
import { SenderAssignmentStore } from "./sender-assignment-store.js";

/** Moves sender assignments through their life cycle and keeps a journal of what it did. */
export class SenderAssignmentCoordinator {
  store: SenderAssignmentStore;
  validator: SenderAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SenderAssignmentEngine;

  constructor(
    store: SenderAssignmentStore,
    validator: SenderAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SenderAssignmentEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender assignment ${code} not found`);
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
      throw new Error(`sender assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newSenderAssignmentCoordinator(store: SenderAssignmentStore, clockValue: clock.Clock): SenderAssignmentCoordinator {
  return new SenderAssignmentCoordinator(
    store,
    defaultSenderAssignmentValidator(),
    clockValue,
    [],
    defaultSenderAssignmentEngine(),
  );
}
