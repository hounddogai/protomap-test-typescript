import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedMentionAuditEngine, defaultWeightedMentionAuditEngine } from "./weighted-mention-audit-engine.js";
import {
  WeightedMentionAuditValidator,
  defaultWeightedMentionAuditValidator,
} from "./weighted-mention-audit-rules.js";
import { WeightedMentionAuditStore } from "./weighted-mention-audit-store.js";

/** Moves weighted mention audits through their life cycle and keeps a journal of what it did. */
export class WeightedMentionAuditManager {
  store: WeightedMentionAuditStore;
  validator: WeightedMentionAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedMentionAuditEngine;

  constructor(
    store: WeightedMentionAuditStore,
    validator: WeightedMentionAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedMentionAuditEngine,
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
      throw new Error(`weighted mention audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention audit ${code} not found`);
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
      throw new Error(`weighted mention audit ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newWeightedMentionAuditManager(store: WeightedMentionAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedMentionAuditManager {
  return new WeightedMentionAuditManager(
    store,
    defaultWeightedMentionAuditValidator(),
    clockValue,
    [],
    defaultWeightedMentionAuditEngine(flagsValue),
  );
}
