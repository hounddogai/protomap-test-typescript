import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalEscalationEstimateEngine,
  defaultRegionalEscalationEstimateEngine,
} from "./regional-escalation-estimate-engine.js";
import {
  RegionalEscalationEstimateValidator,
  defaultRegionalEscalationEstimateValidator,
} from "./regional-escalation-estimate-rules.js";
import { RegionalEscalationEstimateStore } from "./regional-escalation-estimate-store.js";

/** Moves regional escalation estimates through their life cycle and keeps a journal of what it did. */
export class RegionalEscalationEstimateManager {
  store: RegionalEscalationEstimateStore;
  validator: RegionalEscalationEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalEscalationEstimateEngine;

  constructor(
    store: RegionalEscalationEstimateStore,
    validator: RegionalEscalationEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalEscalationEstimateEngine,
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
      throw new Error(`regional escalation estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional escalation estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional escalation estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalEscalationEstimateManager(store: RegionalEscalationEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalEscalationEstimateManager {
  return new RegionalEscalationEstimateManager(
    store,
    defaultRegionalEscalationEstimateValidator(),
    clockValue,
    [],
    defaultRegionalEscalationEstimateEngine(flagsValue),
  );
}
