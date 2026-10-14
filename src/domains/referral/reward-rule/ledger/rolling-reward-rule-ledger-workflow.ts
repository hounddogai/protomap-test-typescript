import * as clock from "../../../../kit/clock.js";
import {
  RollingRewardRuleLedgerEngine,
  defaultRollingRewardRuleLedgerEngine,
} from "./rolling-reward-rule-ledger-engine.js";
import {
  RollingRewardRuleLedgerValidator,
  defaultRollingRewardRuleLedgerValidator,
} from "./rolling-reward-rule-ledger-rules.js";
import { RollingRewardRuleLedgerStore } from "./rolling-reward-rule-ledger-store.js";

/** Moves rolling reward rule ledgers through their life cycle and keeps a journal of what it did. */
export class RollingRewardRuleLedgerManager {
  store: RollingRewardRuleLedgerStore;
  validator: RollingRewardRuleLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingRewardRuleLedgerEngine;

  constructor(
    store: RollingRewardRuleLedgerStore,
    validator: RollingRewardRuleLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingRewardRuleLedgerEngine,
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
      throw new Error(`rolling reward rule ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling reward rule ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling reward rule ledger ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingRewardRuleLedgerManager(store: RollingRewardRuleLedgerStore, clockValue: clock.Clock): RollingRewardRuleLedgerManager {
  return new RollingRewardRuleLedgerManager(
    store,
    defaultRollingRewardRuleLedgerValidator(),
    clockValue,
    [],
    defaultRollingRewardRuleLedgerEngine(),
  );
}
