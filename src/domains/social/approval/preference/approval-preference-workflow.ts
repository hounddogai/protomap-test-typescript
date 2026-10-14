import * as clock from "../../../../kit/clock.js";
import { ApprovalPreferenceEngine, defaultApprovalPreferenceEngine } from "./approval-preference-engine.js";
import { ApprovalPreferenceValidator, defaultApprovalPreferenceValidator } from "./approval-preference-rules.js";
import { ApprovalPreferenceStore } from "./approval-preference-store.js";

/** Moves approval preferences through their life cycle and keeps a journal of what it did. */
export class ApprovalPreferenceCoordinator {
  store: ApprovalPreferenceStore;
  validator: ApprovalPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalPreferenceEngine;

  constructor(
    store: ApprovalPreferenceStore,
    validator: ApprovalPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalPreferenceEngine,
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
      throw new Error(`approval preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval preference ${code} not found`);
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
      throw new Error(`approval preference ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newApprovalPreferenceCoordinator(store: ApprovalPreferenceStore, clockValue: clock.Clock): ApprovalPreferenceCoordinator {
  return new ApprovalPreferenceCoordinator(
    store,
    defaultApprovalPreferenceValidator(),
    clockValue,
    [],
    defaultApprovalPreferenceEngine(),
  );
}
