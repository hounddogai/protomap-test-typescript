import * as clock from "../../../../kit/clock.js";
import { MentionMilestoneEngine, defaultMentionMilestoneEngine } from "./mention-milestone-engine.js";
import { MentionMilestoneValidator, defaultMentionMilestoneValidator } from "./mention-milestone-rules.js";
import { MentionMilestoneStore } from "./mention-milestone-store.js";

/** Moves mention milestones through their life cycle and keeps a journal of what it did. */
export class MentionMilestoneCoordinator {
  store: MentionMilestoneStore;
  validator: MentionMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionMilestoneEngine;

  constructor(
    store: MentionMilestoneStore,
    validator: MentionMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionMilestoneEngine,
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
      throw new Error(`mention milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention milestone ${code} not found`);
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

export function newMentionMilestoneCoordinator(store: MentionMilestoneStore, clockValue: clock.Clock): MentionMilestoneCoordinator {
  return new MentionMilestoneCoordinator(
    store,
    defaultMentionMilestoneValidator(),
    clockValue,
    [],
    defaultMentionMilestoneEngine(),
  );
}
