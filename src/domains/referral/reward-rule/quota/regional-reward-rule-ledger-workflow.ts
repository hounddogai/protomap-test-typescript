import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalRewardRuleLedgerEngine,
  defaultRegionalRewardRuleLedgerEngine,
} from "./regional-reward-rule-ledger-engine.js";
import {
  RegionalRewardRuleLedgerValidator,
  defaultRegionalRewardRuleLedgerValidator,
} from "./regional-reward-rule-ledger-rules.js";
import { RegionalRewardRuleLedgerStore } from "./regional-reward-rule-ledger-store.js";

/** Moves regional reward rule ledgers through their life cycle and keeps a journal of what it did. */
export class RegionalRewardRuleLedgerDesk {
  store: RegionalRewardRuleLedgerStore;
  validator: RegionalRewardRuleLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalRewardRuleLedgerEngine;

  constructor(
    store: RegionalRewardRuleLedgerStore,
    validator: RegionalRewardRuleLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalRewardRuleLedgerEngine,
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
      throw new Error(`regional reward rule ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reward rule ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reward rule ledger ${code} not found`);
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

export function newRegionalRewardRuleLedgerDesk(store: RegionalRewardRuleLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalRewardRuleLedgerDesk {
  return new RegionalRewardRuleLedgerDesk(
    store,
    defaultRegionalRewardRuleLedgerValidator(),
    clockValue,
    [],
    defaultRegionalRewardRuleLedgerEngine(flagsValue),
  );
}
