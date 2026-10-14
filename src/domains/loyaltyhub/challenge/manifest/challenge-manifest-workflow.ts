import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeManifestEngine, defaultChallengeManifestEngine } from "./challenge-manifest-engine.js";
import { ChallengeManifestValidator, defaultChallengeManifestValidator } from "./challenge-manifest-rules.js";
import { ChallengeManifestStore } from "./challenge-manifest-store.js";

/** Moves challenge manifests through their life cycle and keeps a journal of what it did. */
export class ChallengeManifestWorkflow {
  store: ChallengeManifestStore;
  validator: ChallengeManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeManifestEngine;

  constructor(
    store: ChallengeManifestStore,
    validator: ChallengeManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeManifestEngine,
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
      throw new Error(`challenge manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newChallengeManifestWorkflow(store: ChallengeManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeManifestWorkflow {
  return new ChallengeManifestWorkflow(
    store,
    defaultChallengeManifestValidator(),
    clockValue,
    [],
    defaultChallengeManifestEngine(flagsValue),
  );
}
