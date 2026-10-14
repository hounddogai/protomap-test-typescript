import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultRetentionManifestEngineExtra,
  defaultDefaultRetentionManifestEngine,
} from "./default-retention-manifest-engine.js";
import {
  DefaultRetentionManifestValidatorExtra,
  defaultDefaultRetentionManifestValidator,
} from "./default-retention-manifest-rules.js";
import { DefaultRetentionManifestStore } from "./default-retention-manifest-store.js";

/** Moves default retention manifests through their life cycle and keeps a journal of what it did. */
export class DefaultRetentionManifestManager {
  store: DefaultRetentionManifestStore;
  validator: DefaultRetentionManifestValidatorExtra;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultRetentionManifestEngineExtra;

  constructor(
    store: DefaultRetentionManifestStore,
    validator: DefaultRetentionManifestValidatorExtra,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultRetentionManifestEngineExtra,
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
      throw new Error(`default retention manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default retention manifest ${code} not found`);
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
      throw new Error(`default retention manifest ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newDefaultRetentionManifestManager(store: DefaultRetentionManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultRetentionManifestManager {
  return new DefaultRetentionManifestManager(
    store,
    defaultDefaultRetentionManifestValidator(),
    clockValue,
    [],
    defaultDefaultRetentionManifestEngine(flagsValue),
  );
}
