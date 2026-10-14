import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { MentionThresholdEngine, defaultMentionThresholdEngine } from "./mention-threshold-engine.js";
import { MentionThresholdValidator, defaultMentionThresholdValidator } from "./mention-threshold-rules.js";
import { MentionThresholdStore } from "./mention-threshold-store.js";

/** Moves mention thresholds through their life cycle and keeps a journal of what it did. */
export class MentionThresholdCoordinator {
  store: MentionThresholdStore;
  validator: MentionThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionThresholdEngine;

  constructor(
    store: MentionThresholdStore,
    validator: MentionThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionThresholdEngine,
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
      throw new Error(`mention threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention threshold ${code} not found`);
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
      throw new Error(`mention threshold ${code} not found`);
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

export function newMentionThresholdCoordinator(store: MentionThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): MentionThresholdCoordinator {
  return new MentionThresholdCoordinator(
    store,
    defaultMentionThresholdValidator(),
    clockValue,
    [],
    defaultMentionThresholdEngine(flagsValue),
  );
}
