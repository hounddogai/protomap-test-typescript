import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PlacementPolicyEngine, defaultPlacementPolicyEngine } from "./placement-policy-engine.js";
import { PlacementPolicyValidator, defaultPlacementPolicyValidator } from "./placement-policy-rules.js";
import { PlacementPolicyStore } from "./placement-policy-store.js";

/** Moves placement policies through their life cycle and keeps a journal of what it did. */
export class PlacementPolicyManager {
  store: PlacementPolicyStore;
  validator: PlacementPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementPolicyEngine;

  constructor(
    store: PlacementPolicyStore,
    validator: PlacementPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementPolicyEngine,
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
      throw new Error(`placement policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement policy ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPlacementPolicyManager(store: PlacementPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): PlacementPolicyManager {
  return new PlacementPolicyManager(
    store,
    defaultPlacementPolicyValidator(),
    clockValue,
    [],
    defaultPlacementPolicyEngine(flagsValue),
  );
}
