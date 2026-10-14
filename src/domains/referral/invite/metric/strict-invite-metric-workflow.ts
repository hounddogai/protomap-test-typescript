import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictInviteMetricEngine, defaultStrictInviteMetricEngine } from "./strict-invite-metric-engine.js";
import { StrictInviteMetricValidator, defaultStrictInviteMetricValidator } from "./strict-invite-metric-rules.js";
import { StrictInviteMetricStore } from "./strict-invite-metric-store.js";

/** Moves strict invite metrics through their life cycle and keeps a journal of what it did. */
export class StrictInviteMetricWorkflow {
  store: StrictInviteMetricStore;
  validator: StrictInviteMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictInviteMetricEngine;

  constructor(
    store: StrictInviteMetricStore,
    validator: StrictInviteMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictInviteMetricEngine,
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
      throw new Error(`strict invite metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict invite metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict invite metric ${code} not found`);
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

export function newStrictInviteMetricWorkflow(store: StrictInviteMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictInviteMetricWorkflow {
  return new StrictInviteMetricWorkflow(
    store,
    defaultStrictInviteMetricValidator(),
    clockValue,
    [],
    defaultStrictInviteMetricEngine(flagsValue),
  );
}
