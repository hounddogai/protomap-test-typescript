import * as clock from "../../../../kit/clock.js";
import {
  SeasonalFrequencyPolicyEngine,
  defaultSeasonalFrequencyPolicyEngine,
} from "./seasonal-frequency-policy-engine.js";
import {
  SeasonalFrequencyPolicyValidator,
  defaultSeasonalFrequencyPolicyValidator,
} from "./seasonal-frequency-policy-rules.js";
import { SeasonalFrequencyPolicyStore } from "./seasonal-frequency-policy-store.js";

/** Moves seasonal frequency policies through their life cycle and keeps a journal of what it did. */
export class SeasonalFrequencyPolicyManager {
  store: SeasonalFrequencyPolicyStore;
  validator: SeasonalFrequencyPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalFrequencyPolicyEngine;

  constructor(
    store: SeasonalFrequencyPolicyStore,
    validator: SeasonalFrequencyPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalFrequencyPolicyEngine,
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
      throw new Error(`seasonal frequency policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal frequency policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal frequency policy ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newSeasonalFrequencyPolicyManager(store: SeasonalFrequencyPolicyStore, clockValue: clock.Clock): SeasonalFrequencyPolicyManager {
  return new SeasonalFrequencyPolicyManager(
    store,
    defaultSeasonalFrequencyPolicyValidator(),
    clockValue,
    [],
    defaultSeasonalFrequencyPolicyEngine(),
  );
}
