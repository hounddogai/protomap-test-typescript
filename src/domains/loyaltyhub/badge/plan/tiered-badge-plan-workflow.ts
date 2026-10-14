import * as clock from "../../../../kit/clock.js";
import { TieredBadgePlanEngine, defaultTieredBadgePlanEngine } from "./tiered-badge-plan-engine.js";
import { TieredBadgePlanValidator, defaultTieredBadgePlanValidator } from "./tiered-badge-plan-rules.js";
import { TieredBadgePlanStore } from "./tiered-badge-plan-store.js";

/** Moves tiered badge plans through their life cycle and keeps a journal of what it did. */
export class TieredBadgePlanWorkflow {
  store: TieredBadgePlanStore;
  validator: TieredBadgePlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredBadgePlanEngine;

  constructor(
    store: TieredBadgePlanStore,
    validator: TieredBadgePlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredBadgePlanEngine,
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
      throw new Error(`tiered badge plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered badge plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered badge plan ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredBadgePlanWorkflow(store: TieredBadgePlanStore, clockValue: clock.Clock): TieredBadgePlanWorkflow {
  return new TieredBadgePlanWorkflow(
    store,
    defaultTieredBadgePlanValidator(),
    clockValue,
    [],
    defaultTieredBadgePlanEngine(),
  );
}
