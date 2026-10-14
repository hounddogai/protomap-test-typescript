import * as clock from "../../../../kit/clock.js";
import { ApprovalDraftEngine, defaultApprovalDraftEngine } from "./approval-draft-engine.js";
import { ApprovalDraftValidator, defaultApprovalDraftValidator } from "./approval-draft-rules.js";
import { ApprovalDraftStore } from "./approval-draft-store.js";

/** Moves approval drafts through their life cycle and keeps a journal of what it did. */
export class ApprovalDraftCoordinator {
  store: ApprovalDraftStore;
  validator: ApprovalDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalDraftEngine;

  constructor(
    store: ApprovalDraftStore,
    validator: ApprovalDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalDraftEngine,
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
      throw new Error(`approval draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval draft ${code} not found`);
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

export function newApprovalDraftCoordinator(store: ApprovalDraftStore, clockValue: clock.Clock): ApprovalDraftCoordinator {
  return new ApprovalDraftCoordinator(
    store,
    defaultApprovalDraftValidator(),
    clockValue,
    [],
    defaultApprovalDraftEngine(),
  );
}
