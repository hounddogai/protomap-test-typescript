import * as clock from "../../../../kit/clock.js";
import { BranchManifestEngine, defaultBranchManifestEngine } from "./branch-manifest-engine.js";
import { BranchManifestValidator, defaultBranchManifestValidator } from "./branch-manifest-rules.js";
import { BranchManifestStore } from "./branch-manifest-store.js";

/** Moves branch manifests through their life cycle and keeps a journal of what it did. */
export class BranchManifestService {
  store: BranchManifestStore;
  validator: BranchManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchManifestEngine;

  constructor(
    store: BranchManifestStore,
    validator: BranchManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchManifestEngine,
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
      throw new Error(`branch manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch manifest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newBranchManifestService(store: BranchManifestStore, clockValue: clock.Clock): BranchManifestService {
  return new BranchManifestService(
    store,
    defaultBranchManifestValidator(),
    clockValue,
    [],
    defaultBranchManifestEngine(),
  );
}
