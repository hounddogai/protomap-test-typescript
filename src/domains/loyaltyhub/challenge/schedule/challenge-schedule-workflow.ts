import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeScheduleEngine, defaultChallengeScheduleEngine } from "./challenge-schedule-engine.js";
import { ChallengeScheduleValidator, defaultChallengeScheduleValidator } from "./challenge-schedule-rules.js";
import { ChallengeScheduleStore } from "./challenge-schedule-store.js";

/** Moves challenge schedules through their life cycle and keeps a journal of what it did. */
export class ChallengeScheduleCoordinator {
  store: ChallengeScheduleStore;
  validator: ChallengeScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeScheduleEngine;

  constructor(
    store: ChallengeScheduleStore,
    validator: ChallengeScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeScheduleEngine,
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
      throw new Error(`challenge schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge schedule ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newChallengeScheduleCoordinator(store: ChallengeScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeScheduleCoordinator {
  return new ChallengeScheduleCoordinator(
    store,
    defaultChallengeScheduleValidator(),
    clockValue,
    [],
    defaultChallengeScheduleEngine(flagsValue),
  );
}
