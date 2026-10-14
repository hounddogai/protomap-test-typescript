import * as clock from "../../../../kit/clock.js";
import { LenientRewardAuditEngine, defaultLenientRewardAuditEngine } from "./lenient-reward-audit-engine.js";
import { LenientRewardAuditValidator, defaultLenientRewardAuditValidator } from "./lenient-reward-audit-rules.js";
import { LenientRewardAuditStore } from "./lenient-reward-audit-store.js";

/** Moves lenient reward audits through their life cycle and keeps a journal of what it did. */
export class LenientRewardAuditManager {
  store: LenientRewardAuditStore;
  validator: LenientRewardAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientRewardAuditEngine;

  constructor(
    store: LenientRewardAuditStore,
    validator: LenientRewardAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientRewardAuditEngine,
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
      throw new Error(`lenient reward audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward audit ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLenientRewardAuditManager(store: LenientRewardAuditStore, clockValue: clock.Clock): LenientRewardAuditManager {
  return new LenientRewardAuditManager(
    store,
    defaultLenientRewardAuditValidator(),
    clockValue,
    [],
    defaultLenientRewardAuditEngine(),
  );
}
