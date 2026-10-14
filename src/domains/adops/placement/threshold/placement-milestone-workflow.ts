import * as clock from "../../../../kit/clock.js";
import { PlacementMilestoneEngine, defaultPlacementMilestoneEngine } from "./placement-milestone-engine.js";
import { PlacementMilestoneValidator, defaultPlacementMilestoneValidator } from "./placement-milestone-rules.js";
import { PlacementMilestoneStore } from "./placement-milestone-store.js";

/** Moves placement milestones through their life cycle and keeps a journal of what it did. */
export class PlacementMilestoneCoordinator {
  store: PlacementMilestoneStore;
  validator: PlacementMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementMilestoneEngine;

  constructor(
    store: PlacementMilestoneStore,
    validator: PlacementMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementMilestoneEngine,
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
      throw new Error(`placement milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement milestone ${code} not found`);
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
      throw new Error(`placement milestone ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPlacementMilestoneCoordinator(store: PlacementMilestoneStore, clockValue: clock.Clock): PlacementMilestoneCoordinator {
  return new PlacementMilestoneCoordinator(
    store,
    defaultPlacementMilestoneValidator(),
    clockValue,
    [],
    defaultPlacementMilestoneEngine(),
  );
}
