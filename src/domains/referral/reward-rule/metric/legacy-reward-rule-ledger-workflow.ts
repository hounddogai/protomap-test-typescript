import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyRewardRuleLedgerEngine,
  defaultLegacyRewardRuleLedgerEngine,
} from "./legacy-reward-rule-ledger-engine.js";
import {
  LegacyRewardRuleLedgerValidator,
  defaultLegacyRewardRuleLedgerValidator,
} from "./legacy-reward-rule-ledger-rules.js";
import { LegacyRewardRuleLedgerStore } from "./legacy-reward-rule-ledger-store.js";

/** Moves legacy reward rule ledgers through their life cycle and keeps a journal of what it did. */
export class LegacyRewardRuleLedgerManager {
  store: LegacyRewardRuleLedgerStore;
  validator: LegacyRewardRuleLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyRewardRuleLedgerEngine;

  constructor(
    store: LegacyRewardRuleLedgerStore,
    validator: LegacyRewardRuleLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyRewardRuleLedgerEngine,
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
      throw new Error(`legacy reward rule ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reward rule ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reward rule ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newLegacyRewardRuleLedgerManager(store: LegacyRewardRuleLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyRewardRuleLedgerManager {
  return new LegacyRewardRuleLedgerManager(
    store,
    defaultLegacyRewardRuleLedgerValidator(),
    clockValue,
    [],
    defaultLegacyRewardRuleLedgerEngine(flagsValue),
  );
}
