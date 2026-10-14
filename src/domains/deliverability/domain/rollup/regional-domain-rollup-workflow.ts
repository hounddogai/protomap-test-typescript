import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalDomainRollupEngine, defaultRegionalDomainRollupEngine } from "./regional-domain-rollup-engine.js";
import {
  RegionalDomainRollupValidator,
  defaultRegionalDomainRollupValidator,
} from "./regional-domain-rollup-rules.js";
import { RegionalDomainRollupStore } from "./regional-domain-rollup-store.js";

/** Moves regional domain rollups through their life cycle and keeps a journal of what it did. */
export class RegionalDomainRollupWorkflow {
  store: RegionalDomainRollupStore;
  validator: RegionalDomainRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalDomainRollupEngine;

  constructor(
    store: RegionalDomainRollupStore,
    validator: RegionalDomainRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalDomainRollupEngine,
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
      throw new Error(`regional domain rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional domain rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional domain rollup ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalDomainRollupWorkflow(store: RegionalDomainRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalDomainRollupWorkflow {
  return new RegionalDomainRollupWorkflow(
    store,
    defaultRegionalDomainRollupValidator(),
    clockValue,
    [],
    defaultRegionalDomainRollupEngine(flagsValue),
  );
}
