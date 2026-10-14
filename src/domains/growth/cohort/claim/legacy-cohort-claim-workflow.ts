import * as clock from "../../../../kit/clock.js";
import { LegacyCohortClaimEngine, defaultLegacyCohortClaimEngine } from "./legacy-cohort-claim-engine.js";
import { LegacyCohortClaimValidator, defaultLegacyCohortClaimValidator } from "./legacy-cohort-claim-rules.js";
import { LegacyCohortClaimStore } from "./legacy-cohort-claim-store.js";

/** Moves legacy cohort claims through their life cycle and keeps a journal of what it did. */
export class LegacyCohortClaimManager {
  store: LegacyCohortClaimStore;
  validator: LegacyCohortClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyCohortClaimEngine;

  constructor(
    store: LegacyCohortClaimStore,
    validator: LegacyCohortClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyCohortClaimEngine,
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
      throw new Error(`legacy cohort claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy cohort claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy cohort claim ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyCohortClaimManager(store: LegacyCohortClaimStore, clockValue: clock.Clock): LegacyCohortClaimManager {
  return new LegacyCohortClaimManager(
    store,
    defaultLegacyCohortClaimValidator(),
    clockValue,
    [],
    defaultLegacyCohortClaimEngine(),
  );
}
