import * as clock from "../../../../kit/clock.js";
import { ApprovalMappingEngine, defaultApprovalMappingEngine } from "./approval-mapping-engine.js";
import { ApprovalMappingValidator, defaultApprovalMappingValidator } from "./approval-mapping-rules.js";
import { ApprovalMappingStore } from "./approval-mapping-store.js";

/** Moves approval mappings through their life cycle and keeps a journal of what it did. */
export class ApprovalMappingCoordinator {
  store: ApprovalMappingStore;
  validator: ApprovalMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalMappingEngine;

  constructor(
    store: ApprovalMappingStore,
    validator: ApprovalMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalMappingEngine,
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
      throw new Error(`approval mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newApprovalMappingCoordinator(store: ApprovalMappingStore, clockValue: clock.Clock): ApprovalMappingCoordinator {
  return new ApprovalMappingCoordinator(
    store,
    defaultApprovalMappingValidator(),
    clockValue,
    [],
    defaultApprovalMappingEngine(),
  );
}
