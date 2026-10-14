import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalPathPolicyEngine, defaultRegionalPathPolicyEngine } from "./regional-path-policy-engine.js";
import { RegionalPathPolicyValidator, defaultRegionalPathPolicyValidator } from "./regional-path-policy-rules.js";
import { RegionalPathPolicyStore } from "./regional-path-policy-store.js";

/** Moves regional path policies through their life cycle and keeps a journal of what it did. */
export class RegionalPathPolicyDesk {
  store: RegionalPathPolicyStore;
  validator: RegionalPathPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalPathPolicyEngine;

  constructor(
    store: RegionalPathPolicyStore,
    validator: RegionalPathPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalPathPolicyEngine,
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
      throw new Error(`regional path policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional path policy ${code} not found`);
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
      throw new Error(`regional path policy ${code} not found`);
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

export function newRegionalPathPolicyDesk(store: RegionalPathPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalPathPolicyDesk {
  return new RegionalPathPolicyDesk(
    store,
    defaultRegionalPathPolicyValidator(),
    clockValue,
    [],
    defaultRegionalPathPolicyEngine(flagsValue),
  );
}
