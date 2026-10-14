import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredExitRuleDigestEngine, defaultTieredExitRuleDigestEngine } from "./tiered-exit-rule-digest-engine.js";
import {
  TieredExitRuleDigestValidator,
  defaultTieredExitRuleDigestValidator,
} from "./tiered-exit-rule-digest-rules.js";
import { TieredExitRuleDigestStore } from "./tiered-exit-rule-digest-store.js";

/** Moves tiered exit rule digests through their life cycle and keeps a journal of what it did. */
export class TieredExitRuleDigestDesk {
  store: TieredExitRuleDigestStore;
  validator: TieredExitRuleDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredExitRuleDigestEngine;

  constructor(
    store: TieredExitRuleDigestStore,
    validator: TieredExitRuleDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredExitRuleDigestEngine,
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
      throw new Error(`tiered exit rule digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered exit rule digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered exit rule digest ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredExitRuleDigestDesk(store: TieredExitRuleDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredExitRuleDigestDesk {
  return new TieredExitRuleDigestDesk(
    store,
    defaultTieredExitRuleDigestValidator(),
    clockValue,
    [],
    defaultTieredExitRuleDigestEngine(flagsValue),
  );
}
