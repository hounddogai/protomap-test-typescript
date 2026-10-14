import * as clock from "../../../../kit/clock.js";
import {
  LegacyExitRuleSegmentEngine,
  defaultLegacyExitRuleSegmentEngine,
} from "./legacy-exit-rule-segment-engine.js";
import {
  LegacyExitRuleSegmentValidator,
  defaultLegacyExitRuleSegmentValidator,
} from "./legacy-exit-rule-segment-rules.js";
import { LegacyExitRuleSegmentStore } from "./legacy-exit-rule-segment-store.js";

/** Moves legacy exit rule segments through their life cycle and keeps a journal of what it did. */
export class LegacyExitRuleSegmentWorkflow {
  store: LegacyExitRuleSegmentStore;
  validator: LegacyExitRuleSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyExitRuleSegmentEngine;

  constructor(
    store: LegacyExitRuleSegmentStore,
    validator: LegacyExitRuleSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyExitRuleSegmentEngine,
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
      throw new Error(`legacy exit rule segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy exit rule segment ${code} not found`);
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
      throw new Error(`legacy exit rule segment ${code} not found`);
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

export function newLegacyExitRuleSegmentWorkflow(store: LegacyExitRuleSegmentStore, clockValue: clock.Clock): LegacyExitRuleSegmentWorkflow {
  return new LegacyExitRuleSegmentWorkflow(
    store,
    defaultLegacyExitRuleSegmentValidator(),
    clockValue,
    [],
    defaultLegacyExitRuleSegmentEngine(),
  );
}
