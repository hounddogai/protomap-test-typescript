import * as clock from "../../../../kit/clock.js";
import { WindowMilestoneEngine, defaultWindowMilestoneEngine } from "./window-milestone-engine.js";
import { WindowMilestoneValidator, defaultWindowMilestoneValidator } from "./window-milestone-rules.js";
import { WindowMilestoneStore } from "./window-milestone-store.js";

/** Moves window milestones through their life cycle and keeps a journal of what it did. */
export class WindowMilestoneService {
  store: WindowMilestoneStore;
  validator: WindowMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowMilestoneEngine;

  constructor(
    store: WindowMilestoneStore,
    validator: WindowMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowMilestoneEngine,
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
      throw new Error(`window milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window milestone ${code} not found`);
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

export function newWindowMilestoneService(store: WindowMilestoneStore, clockValue: clock.Clock): WindowMilestoneService {
  return new WindowMilestoneService(
    store,
    defaultWindowMilestoneValidator(),
    clockValue,
    [],
    defaultWindowMilestoneEngine(),
  );
}
