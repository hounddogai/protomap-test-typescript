import * as clock from "../../../../kit/clock.js";
import {
  ManualRetentionAgreementEngine,
  defaultManualRetentionAgreementEngine,
} from "./manual-retention-agreement-engine.js";
import {
  ManualRetentionAgreementValidator,
  defaultManualRetentionAgreementValidator,
} from "./manual-retention-agreement-rules.js";
import { ManualRetentionAgreementStore } from "./manual-retention-agreement-store.js";

/** Moves manual retention agreements through their life cycle and keeps a journal of what it did. */
export class ManualRetentionAgreementManager {
  store: ManualRetentionAgreementStore;
  validator: ManualRetentionAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualRetentionAgreementEngine;

  constructor(
    store: ManualRetentionAgreementStore,
    validator: ManualRetentionAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualRetentionAgreementEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newManualRetentionAgreementManager(store: ManualRetentionAgreementStore, clockValue: clock.Clock): ManualRetentionAgreementManager {
  return new ManualRetentionAgreementManager(
    store,
    defaultManualRetentionAgreementValidator(),
    clockValue,
    [],
    defaultManualRetentionAgreementEngine(),
  );
}
