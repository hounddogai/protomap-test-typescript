import * as clock from "../../../../kit/clock.js";
import { DefaultPostMilestoneEngine, defaultDefaultPostMilestoneEngine } from "./default-post-milestone-engine.js";
import {
  DefaultPostMilestoneValidator,
  defaultDefaultPostMilestoneValidator,
} from "./default-post-milestone-rules.js";
import { DefaultPostMilestoneStore } from "./default-post-milestone-store.js";

/** Moves default post milestones through their life cycle and keeps a journal of what it did. */
export class DefaultPostMilestoneDesk {
  store: DefaultPostMilestoneStore;
  validator: DefaultPostMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPostMilestoneEngine;

  constructor(
    store: DefaultPostMilestoneStore,
    validator: DefaultPostMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPostMilestoneEngine,
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
      throw new Error(`default post milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default post milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default post milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDefaultPostMilestoneDesk(store: DefaultPostMilestoneStore, clockValue: clock.Clock): DefaultPostMilestoneDesk {
  return new DefaultPostMilestoneDesk(
    store,
    defaultDefaultPostMilestoneValidator(),
    clockValue,
    [],
    defaultDefaultPostMilestoneEngine(),
  );
}
