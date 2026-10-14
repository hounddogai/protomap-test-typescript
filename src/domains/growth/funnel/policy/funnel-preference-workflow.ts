import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FunnelPreferenceEngine, defaultFunnelPreferenceEngine } from "./funnel-preference-engine.js";
import { FunnelPreferenceValidator, defaultFunnelPreferenceValidator } from "./funnel-preference-rules.js";
import { FunnelPreferenceStore } from "./funnel-preference-store.js";

/** Moves funnel preferences through their life cycle and keeps a journal of what it did. */
export class FunnelPreferenceService {
  store: FunnelPreferenceStore;
  validator: FunnelPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelPreferenceEngine;

  constructor(
    store: FunnelPreferenceStore,
    validator: FunnelPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelPreferenceEngine,
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
      throw new Error(`funnel preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newFunnelPreferenceService(store: FunnelPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FunnelPreferenceService {
  return new FunnelPreferenceService(
    store,
    defaultFunnelPreferenceValidator(),
    clockValue,
    [],
    defaultFunnelPreferenceEngine(flagsValue),
  );
}
