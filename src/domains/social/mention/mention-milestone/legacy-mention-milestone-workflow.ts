import * as clock from "../../../../kit/clock.js";
import {
  LegacyMentionMilestoneEngine,
  defaultLegacyMentionMilestoneEngine,
} from "./legacy-mention-milestone-engine.js";
import {
  LegacyMentionMilestoneValidator,
  defaultLegacyMentionMilestoneValidator,
} from "./legacy-mention-milestone-rules.js";
import { LegacyMentionMilestoneStore } from "./legacy-mention-milestone-store.js";

/** Moves legacy mention milestones through their life cycle and keeps a journal of what it did. */
export class LegacyMentionMilestoneManager {
  store: LegacyMentionMilestoneStore;
  validator: LegacyMentionMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyMentionMilestoneEngine;

  constructor(
    store: LegacyMentionMilestoneStore,
    validator: LegacyMentionMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyMentionMilestoneEngine,
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
      throw new Error(`legacy mention milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy mention milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy mention milestone ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLegacyMentionMilestoneManager(store: LegacyMentionMilestoneStore, clockValue: clock.Clock): LegacyMentionMilestoneManager {
  return new LegacyMentionMilestoneManager(
    store,
    defaultLegacyMentionMilestoneValidator(),
    clockValue,
    [],
    defaultLegacyMentionMilestoneEngine(),
  );
}
