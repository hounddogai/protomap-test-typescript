import * as clock from "../../../../kit/clock.js";
import { LegacyChallengeTargetEngine, defaultLegacyChallengeTargetEngine } from "./legacy-challenge-target-engine.js";
import {
  LegacyChallengeTargetValidator,
  defaultLegacyChallengeTargetValidator,
} from "./legacy-challenge-target-rules.js";
import { LegacyChallengeTargetStore } from "./legacy-challenge-target-store.js";

/** Moves legacy challenge targets through their life cycle and keeps a journal of what it did. */
export class LegacyChallengeTargetManager {
  store: LegacyChallengeTargetStore;
  validator: LegacyChallengeTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyChallengeTargetEngine;

  constructor(
    store: LegacyChallengeTargetStore,
    validator: LegacyChallengeTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyChallengeTargetEngine,
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
      throw new Error(`legacy challenge target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy challenge target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy challenge target ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLegacyChallengeTargetManager(store: LegacyChallengeTargetStore, clockValue: clock.Clock): LegacyChallengeTargetManager {
  return new LegacyChallengeTargetManager(
    store,
    defaultLegacyChallengeTargetValidator(),
    clockValue,
    [],
    defaultLegacyChallengeTargetEngine(),
  );
}
