import * as clock from "../../../../kit/clock.js";
import { ManualApprovalQuotaEngine, defaultManualApprovalQuotaEngine } from "./manual-approval-quota-engine.js";
import { ManualApprovalQuotaValidator, defaultManualApprovalQuotaValidator } from "./manual-approval-quota-rules.js";
import { ManualApprovalQuotaStore } from "./manual-approval-quota-store.js";

/** Moves manual approval quotas through their life cycle and keeps a journal of what it did. */
export class ManualApprovalQuotaService {
  store: ManualApprovalQuotaStore;
  validator: ManualApprovalQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualApprovalQuotaEngine;

  constructor(
    store: ManualApprovalQuotaStore,
    validator: ManualApprovalQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualApprovalQuotaEngine,
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
      throw new Error(`manual approval quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual approval quota ${code} not found`);
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
      throw new Error(`manual approval quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newManualApprovalQuotaService(store: ManualApprovalQuotaStore, clockValue: clock.Clock): ManualApprovalQuotaService {
  return new ManualApprovalQuotaService(
    store,
    defaultManualApprovalQuotaValidator(),
    clockValue,
    [],
    defaultManualApprovalQuotaEngine(),
  );
}
