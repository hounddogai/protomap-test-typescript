import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledMentionMappingEngine,
  defaultScheduledMentionMappingEngine,
} from "./scheduled-mention-mapping-engine.js";
import {
  ScheduledMentionMappingValidator,
  defaultScheduledMentionMappingValidator,
} from "./scheduled-mention-mapping-rules.js";
import { ScheduledMentionMappingStore } from "./scheduled-mention-mapping-store.js";

/** Moves scheduled mention mappings through their life cycle and keeps a journal of what it did. */
export class ScheduledMentionMappingWorkflow {
  store: ScheduledMentionMappingStore;
  validator: ScheduledMentionMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledMentionMappingEngine;

  constructor(
    store: ScheduledMentionMappingStore,
    validator: ScheduledMentionMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledMentionMappingEngine,
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
      throw new Error(`scheduled mention mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled mention mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled mention mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newScheduledMentionMappingWorkflow(store: ScheduledMentionMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledMentionMappingWorkflow {
  return new ScheduledMentionMappingWorkflow(
    store,
    defaultScheduledMentionMappingValidator(),
    clockValue,
    [],
    defaultScheduledMentionMappingEngine(flagsValue),
  );
}
