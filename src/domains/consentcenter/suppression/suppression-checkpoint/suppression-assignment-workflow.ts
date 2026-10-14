import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SuppressionAssignmentEngine, defaultSuppressionAssignmentEngine } from "./suppression-assignment-engine.js";
import {
  SuppressionAssignmentValidator,
  defaultSuppressionAssignmentValidator,
} from "./suppression-assignment-rules.js";
import { SuppressionAssignmentStore } from "./suppression-assignment-store.js";

/** Moves suppression assignments through their life cycle and keeps a journal of what it did. */
export class SuppressionAssignmentService {
  store: SuppressionAssignmentStore;
  validator: SuppressionAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SuppressionAssignmentEngine;

  constructor(
    store: SuppressionAssignmentStore,
    validator: SuppressionAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SuppressionAssignmentEngine,
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
      throw new Error(`suppression assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSuppressionAssignmentService(store: SuppressionAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): SuppressionAssignmentService {
  return new SuppressionAssignmentService(
    store,
    defaultSuppressionAssignmentValidator(),
    clockValue,
    [],
    defaultSuppressionAssignmentEngine(flagsValue),
  );
}
