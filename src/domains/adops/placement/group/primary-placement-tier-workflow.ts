import * as clock from "../../../../kit/clock.js";
import { PrimaryPlacementTierEngine, defaultPrimaryPlacementTierEngine } from "./primary-placement-tier-engine.js";
import {
  PrimaryPlacementTierValidator,
  defaultPrimaryPlacementTierValidator,
} from "./primary-placement-tier-rules.js";
import { PrimaryPlacementTierStore } from "./primary-placement-tier-store.js";

/** Moves primary placement tiers through their life cycle and keeps a journal of what it did. */
export class PrimaryPlacementTierService {
  store: PrimaryPlacementTierStore;
  validator: PrimaryPlacementTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryPlacementTierEngine;

  constructor(
    store: PrimaryPlacementTierStore,
    validator: PrimaryPlacementTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryPlacementTierEngine,
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
      throw new Error(`primary placement tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary placement tier ${code} not found`);
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
      throw new Error(`primary placement tier ${code} not found`);
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

export function newPrimaryPlacementTierService(store: PrimaryPlacementTierStore, clockValue: clock.Clock): PrimaryPlacementTierService {
  return new PrimaryPlacementTierService(
    store,
    defaultPrimaryPlacementTierValidator(),
    clockValue,
    [],
    defaultPrimaryPlacementTierEngine(),
  );
}
