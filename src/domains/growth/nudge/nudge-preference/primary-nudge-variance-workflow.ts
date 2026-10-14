import * as clock from "../../../../kit/clock.js";
import { PrimaryNudgeVarianceEngine, defaultPrimaryNudgeVarianceEngine } from "./primary-nudge-variance-engine.js";
import {
  PrimaryNudgeVarianceValidator,
  defaultPrimaryNudgeVarianceValidator,
} from "./primary-nudge-variance-rules.js";
import { PrimaryNudgeVarianceStore } from "./primary-nudge-variance-store.js";

/** Moves primary nudge variances through their life cycle and keeps a journal of what it did. */
export class PrimaryNudgeVarianceManager {
  store: PrimaryNudgeVarianceStore;
  validator: PrimaryNudgeVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryNudgeVarianceEngine;

  constructor(
    store: PrimaryNudgeVarianceStore,
    validator: PrimaryNudgeVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryNudgeVarianceEngine,
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
      throw new Error(`primary nudge variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary nudge variance ${code} not found`);
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
      throw new Error(`primary nudge variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPrimaryNudgeVarianceManager(store: PrimaryNudgeVarianceStore, clockValue: clock.Clock): PrimaryNudgeVarianceManager {
  return new PrimaryNudgeVarianceManager(
    store,
    defaultPrimaryNudgeVarianceValidator(),
    clockValue,
    [],
    defaultPrimaryNudgeVarianceEngine(),
  );
}
