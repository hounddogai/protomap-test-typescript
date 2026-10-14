import * as clock from "../../../../kit/clock.js";
import { RegionalFunnelRequestEngine, defaultRegionalFunnelRequestEngine } from "./regional-funnel-request-engine.js";
import {
  RegionalFunnelRequestValidator,
  defaultRegionalFunnelRequestValidator,
} from "./regional-funnel-request-rules.js";
import { RegionalFunnelRequestStore } from "./regional-funnel-request-store.js";

/** Moves regional funnel requests through their life cycle and keeps a journal of what it did. */
export class RegionalFunnelRequestWorkflow {
  store: RegionalFunnelRequestStore;
  validator: RegionalFunnelRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalFunnelRequestEngine;

  constructor(
    store: RegionalFunnelRequestStore,
    validator: RegionalFunnelRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalFunnelRequestEngine,
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
      throw new Error(`regional funnel request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional funnel request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional funnel request ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRegionalFunnelRequestWorkflow(store: RegionalFunnelRequestStore, clockValue: clock.Clock): RegionalFunnelRequestWorkflow {
  return new RegionalFunnelRequestWorkflow(
    store,
    defaultRegionalFunnelRequestValidator(),
    clockValue,
    [],
    defaultRegionalFunnelRequestEngine(),
  );
}
