import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SeasonalTierPolicyEngine, defaultSeasonalTierPolicyEngine } from "./seasonal-tier-policy-engine.js";
import { SeasonalTierPolicyValidator, defaultSeasonalTierPolicyValidator } from "./seasonal-tier-policy-rules.js";
import { SeasonalTierPolicyStore } from "./seasonal-tier-policy-store.js";

/** Moves seasonal tier policies through their life cycle and keeps a journal of what it did. */
export class SeasonalTierPolicyService {
  store: SeasonalTierPolicyStore;
  validator: SeasonalTierPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalTierPolicyEngine;

  constructor(
    store: SeasonalTierPolicyStore,
    validator: SeasonalTierPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalTierPolicyEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal tier policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal tier policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal tier policy ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSeasonalTierPolicyService(store: SeasonalTierPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalTierPolicyService {
  return new SeasonalTierPolicyService(
    store,
    defaultSeasonalTierPolicyValidator(),
    clockValue,
    [],
    defaultSeasonalTierPolicyEngine(flagsValue),
  );
}
