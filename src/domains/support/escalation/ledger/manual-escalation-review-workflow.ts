import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualEscalationReviewEngine,
  defaultManualEscalationReviewEngine,
} from "./manual-escalation-review-engine.js";
import {
  ManualEscalationReviewValidator,
  defaultManualEscalationReviewValidator,
} from "./manual-escalation-review-rules.js";
import { ManualEscalationReviewStore } from "./manual-escalation-review-store.js";

/** Moves manual escalation reviews through their life cycle and keeps a journal of what it did. */
export class ManualEscalationReviewManager {
  store: ManualEscalationReviewStore;
  validator: ManualEscalationReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualEscalationReviewEngine;

  constructor(
    store: ManualEscalationReviewStore,
    validator: ManualEscalationReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualEscalationReviewEngine,
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
      throw new Error(`manual escalation review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual escalation review ${code} not found`);
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
      throw new Error(`manual escalation review ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newManualEscalationReviewManager(store: ManualEscalationReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualEscalationReviewManager {
  return new ManualEscalationReviewManager(
    store,
    defaultManualEscalationReviewValidator(),
    clockValue,
    [],
    defaultManualEscalationReviewEngine(flagsValue),
  );
}
