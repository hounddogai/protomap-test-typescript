import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ApprovalScoreEngine, defaultApprovalScoreEngine } from "./approval-score-engine.js";
import { ApprovalScoreValidator, defaultApprovalScoreValidator } from "./approval-score-rules.js";
import { ApprovalScoreStore } from "./approval-score-store.js";

/** Moves approval scores through their life cycle and keeps a journal of what it did. */
export class ApprovalScoreManager {
  store: ApprovalScoreStore;
  validator: ApprovalScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalScoreEngine;

  constructor(
    store: ApprovalScoreStore,
    validator: ApprovalScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalScoreEngine,
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
      throw new Error(`approval score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval score ${code} not found`);
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

export function newApprovalScoreManager(store: ApprovalScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): ApprovalScoreManager {
  return new ApprovalScoreManager(
    store,
    defaultApprovalScoreValidator(),
    clockValue,
    [],
    defaultApprovalScoreEngine(flagsValue),
  );
}
