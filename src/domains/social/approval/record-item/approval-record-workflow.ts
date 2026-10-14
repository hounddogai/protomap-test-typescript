import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ApprovalRecordEngine, defaultApprovalRecordEngine } from "./approval-record-engine.js";
import { ApprovalRecordValidator, defaultApprovalRecordValidator } from "./approval-record-rules.js";
import { ApprovalRecordStore } from "./approval-record-store.js";

/** Moves approval records through their life cycle and keeps a journal of what it did. */
export class ApprovalRecordWorkflow {
  store: ApprovalRecordStore;
  validator: ApprovalRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalRecordEngine;

  constructor(
    store: ApprovalRecordStore,
    validator: ApprovalRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalRecordEngine,
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
      throw new Error(`approval record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval record ${code} not found`);
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
      throw new Error(`approval record ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newApprovalRecordWorkflow(store: ApprovalRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ApprovalRecordWorkflow {
  return new ApprovalRecordWorkflow(
    store,
    defaultApprovalRecordValidator(),
    clockValue,
    [],
    defaultApprovalRecordEngine(flagsValue),
  );
}
