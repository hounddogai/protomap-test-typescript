import * as clock from "../../../../kit/clock.js";
import {
  ScheduledPreferenceAssignmentEngine,
  defaultScheduledPreferenceAssignmentEngine,
} from "./scheduled-preference-assignment-engine.js";
import {
  ScheduledPreferenceAssignmentValidator,
  defaultScheduledPreferenceAssignmentValidator,
} from "./scheduled-preference-assignment-rules.js";
import { ScheduledPreferenceAssignmentStore } from "./scheduled-preference-assignment-store.js";

/** Moves scheduled preference assignments through their life cycle and keeps a journal of what it did. */
export class ScheduledPreferenceAssignmentWorkflow {
  store: ScheduledPreferenceAssignmentStore;
  validator: ScheduledPreferenceAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledPreferenceAssignmentEngine;

  constructor(
    store: ScheduledPreferenceAssignmentStore,
    validator: ScheduledPreferenceAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledPreferenceAssignmentEngine,
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
      throw new Error(`scheduled preference assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled preference assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled preference assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledPreferenceAssignmentWorkflow(store: ScheduledPreferenceAssignmentStore, clockValue: clock.Clock): ScheduledPreferenceAssignmentWorkflow {
  return new ScheduledPreferenceAssignmentWorkflow(
    store,
    defaultScheduledPreferenceAssignmentValidator(),
    clockValue,
    [],
    defaultScheduledPreferenceAssignmentEngine(),
  );
}
