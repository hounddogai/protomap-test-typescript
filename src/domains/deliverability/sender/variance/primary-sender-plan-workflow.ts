import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimarySenderPlanEngine, defaultPrimarySenderPlanEngine } from "./primary-sender-plan-engine.js";
import { PrimarySenderPlanValidator, defaultPrimarySenderPlanValidator } from "./primary-sender-plan-rules.js";
import { PrimarySenderPlanStore } from "./primary-sender-plan-store.js";

/** Moves primary sender plans through their life cycle and keeps a journal of what it did. */
export class PrimarySenderPlanCoordinator {
  store: PrimarySenderPlanStore;
  validator: PrimarySenderPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimarySenderPlanEngine;

  constructor(
    store: PrimarySenderPlanStore,
    validator: PrimarySenderPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimarySenderPlanEngine,
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
      throw new Error(`primary sender plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPrimarySenderPlanCoordinator(store: PrimarySenderPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimarySenderPlanCoordinator {
  return new PrimarySenderPlanCoordinator(
    store,
    defaultPrimarySenderPlanValidator(),
    clockValue,
    [],
    defaultPrimarySenderPlanEngine(flagsValue),
  );
}
