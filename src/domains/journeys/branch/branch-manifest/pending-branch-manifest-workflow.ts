import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingBranchManifestEngine, defaultPendingBranchManifestEngine } from "./pending-branch-manifest-engine.js";
import {
  PendingBranchManifestValidator,
  defaultPendingBranchManifestValidator,
} from "./pending-branch-manifest-rules.js";
import { PendingBranchManifestStore } from "./pending-branch-manifest-store.js";

/** Moves pending branch manifests through their life cycle and keeps a journal of what it did. */
export class PendingBranchManifestDesk {
  store: PendingBranchManifestStore;
  validator: PendingBranchManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBranchManifestEngine;

  constructor(
    store: PendingBranchManifestStore,
    validator: PendingBranchManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBranchManifestEngine,
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
      throw new Error(`pending branch manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending branch manifest ${code} not found`);
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
      throw new Error(`pending branch manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPendingBranchManifestDesk(store: PendingBranchManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingBranchManifestDesk {
  return new PendingBranchManifestDesk(
    store,
    defaultPendingBranchManifestValidator(),
    clockValue,
    [],
    defaultPendingBranchManifestEngine(flagsValue),
  );
}
