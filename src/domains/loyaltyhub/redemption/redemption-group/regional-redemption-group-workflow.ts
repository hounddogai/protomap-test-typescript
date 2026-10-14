import * as clock from "../../../../kit/clock.js";
import {
  RegionalRedemptionGroupEngine,
  defaultRegionalRedemptionGroupEngine,
} from "./regional-redemption-group-engine.js";
import {
  RegionalRedemptionGroupValidator,
  defaultRegionalRedemptionGroupValidator,
} from "./regional-redemption-group-rules.js";
import { RegionalRedemptionGroupStore } from "./regional-redemption-group-store.js";

/** Moves regional redemption groups through their life cycle and keeps a journal of what it did. */
export class RegionalRedemptionGroupService {
  store: RegionalRedemptionGroupStore;
  validator: RegionalRedemptionGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalRedemptionGroupEngine;

  constructor(
    store: RegionalRedemptionGroupStore,
    validator: RegionalRedemptionGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalRedemptionGroupEngine,
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
      throw new Error(`regional redemption group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional redemption group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional redemption group ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalRedemptionGroupService(store: RegionalRedemptionGroupStore, clockValue: clock.Clock): RegionalRedemptionGroupService {
  return new RegionalRedemptionGroupService(
    store,
    defaultRegionalRedemptionGroupValidator(),
    clockValue,
    [],
    defaultRegionalRedemptionGroupEngine(),
  );
}
