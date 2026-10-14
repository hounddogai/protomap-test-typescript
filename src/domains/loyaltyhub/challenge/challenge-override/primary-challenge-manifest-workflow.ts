import * as clock from "../../../../kit/clock.js";
import {
  PrimaryChallengeManifestEngine,
  defaultPrimaryChallengeManifestEngine,
} from "./primary-challenge-manifest-engine.js";
import {
  PrimaryChallengeManifestValidator,
  defaultPrimaryChallengeManifestValidator,
} from "./primary-challenge-manifest-rules.js";
import { PrimaryChallengeManifestStore } from "./primary-challenge-manifest-store.js";

/** Moves primary challenge manifests through their life cycle and keeps a journal of what it did. */
export class PrimaryChallengeManifestWorkflow {
  store: PrimaryChallengeManifestStore;
  validator: PrimaryChallengeManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryChallengeManifestEngine;

  constructor(
    store: PrimaryChallengeManifestStore,
    validator: PrimaryChallengeManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryChallengeManifestEngine,
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
      throw new Error(`primary challenge manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary challenge manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary challenge manifest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryChallengeManifestWorkflow(store: PrimaryChallengeManifestStore, clockValue: clock.Clock): PrimaryChallengeManifestWorkflow {
  return new PrimaryChallengeManifestWorkflow(
    store,
    defaultPrimaryChallengeManifestValidator(),
    clockValue,
    [],
    defaultPrimaryChallengeManifestEngine(),
  );
}
