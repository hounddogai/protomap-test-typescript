import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveReputationPlanEngine,
  defaultAdaptiveReputationPlanEngine,
} from "./adaptive-reputation-plan-engine.js";
import {
  AdaptiveReputationPlanValidator,
  defaultAdaptiveReputationPlanValidator,
} from "./adaptive-reputation-plan-rules.js";
import { AdaptiveReputationPlanStore } from "./adaptive-reputation-plan-store.js";

/** Moves adaptive reputation plans through their life cycle and keeps a journal of what it did. */
export class AdaptiveReputationPlanDesk {
  store: AdaptiveReputationPlanStore;
  validator: AdaptiveReputationPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveReputationPlanEngine;

  constructor(
    store: AdaptiveReputationPlanStore,
    validator: AdaptiveReputationPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveReputationPlanEngine,
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
      throw new Error(`adaptive reputation plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive reputation plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive reputation plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveReputationPlanDesk(store: AdaptiveReputationPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveReputationPlanDesk {
  return new AdaptiveReputationPlanDesk(
    store,
    defaultAdaptiveReputationPlanValidator(),
    clockValue,
    [],
    defaultAdaptiveReputationPlanEngine(flagsValue),
  );
}
