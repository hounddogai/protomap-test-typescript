import * as clock from "../../../../kit/clock.js";
import { RollingSlaWindowEngine, defaultRollingSlaWindowEngine } from "./rolling-sla-window-engine.js";
import { RollingSlaWindowValidator, defaultRollingSlaWindowValidator } from "./rolling-sla-window-rules.js";
import { RollingSlaWindowStore } from "./rolling-sla-window-store.js";

/** Moves rolling sla windows through their life cycle and keeps a journal of what it did. */
export class RollingSlaWindowManager {
  store: RollingSlaWindowStore;
  validator: RollingSlaWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingSlaWindowEngine;

  constructor(
    store: RollingSlaWindowStore,
    validator: RollingSlaWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingSlaWindowEngine,
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
      throw new Error(`rolling sla window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling sla window ${code} not found`);
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
      throw new Error(`rolling sla window ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRollingSlaWindowManager(store: RollingSlaWindowStore, clockValue: clock.Clock): RollingSlaWindowManager {
  return new RollingSlaWindowManager(
    store,
    defaultRollingSlaWindowValidator(),
    clockValue,
    [],
    defaultRollingSlaWindowEngine(),
  );
}
