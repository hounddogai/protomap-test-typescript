import * as clock from "../../../../kit/clock.js";
import { BadgeThresholdEngine, defaultBadgeThresholdEngine } from "./badge-threshold-engine.js";
import { BadgeThresholdValidator, defaultBadgeThresholdValidator } from "./badge-threshold-rules.js";
import { BadgeThresholdStore } from "./badge-threshold-store.js";

/** Moves badge thresholds through their life cycle and keeps a journal of what it did. */
export class BadgeThresholdService {
  store: BadgeThresholdStore;
  validator: BadgeThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeThresholdEngine;

  constructor(
    store: BadgeThresholdStore,
    validator: BadgeThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeThresholdEngine,
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
      throw new Error(`badge threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge threshold ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBadgeThresholdService(store: BadgeThresholdStore, clockValue: clock.Clock): BadgeThresholdService {
  return new BadgeThresholdService(
    store,
    defaultBadgeThresholdValidator(),
    clockValue,
    [],
    defaultBadgeThresholdEngine(),
  );
}
