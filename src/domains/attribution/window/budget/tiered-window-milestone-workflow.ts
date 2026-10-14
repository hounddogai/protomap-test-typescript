import * as clock from "../../../../kit/clock.js";
import { TieredWindowMilestoneEngine, defaultTieredWindowMilestoneEngine } from "./tiered-window-milestone-engine.js";
import {
  TieredWindowMilestoneValidator,
  defaultTieredWindowMilestoneValidator,
} from "./tiered-window-milestone-rules.js";
import { TieredWindowMilestoneStore } from "./tiered-window-milestone-store.js";

/** Moves tiered window milestones through their life cycle and keeps a journal of what it did. */
export class TieredWindowMilestoneManager {
  store: TieredWindowMilestoneStore;
  validator: TieredWindowMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredWindowMilestoneEngine;

  constructor(
    store: TieredWindowMilestoneStore,
    validator: TieredWindowMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredWindowMilestoneEngine,
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
      throw new Error(`tiered window milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered window milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered window milestone ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredWindowMilestoneManager(store: TieredWindowMilestoneStore, clockValue: clock.Clock): TieredWindowMilestoneManager {
  return new TieredWindowMilestoneManager(
    store,
    defaultTieredWindowMilestoneValidator(),
    clockValue,
    [],
    defaultTieredWindowMilestoneEngine(),
  );
}
