import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalRetentionBundleEngine, defaultGlobalRetentionBundleEngine } from "./global-retention-bundle-engine.js";
import {
  GlobalRetentionBundleValidator,
  defaultGlobalRetentionBundleValidator,
} from "./global-retention-bundle-rules.js";
import { GlobalRetentionBundleStore } from "./global-retention-bundle-store.js";

/** Moves global retention bundles through their life cycle and keeps a journal of what it did. */
export class GlobalRetentionBundleService {
  store: GlobalRetentionBundleStore;
  validator: GlobalRetentionBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalRetentionBundleEngine;

  constructor(
    store: GlobalRetentionBundleStore,
    validator: GlobalRetentionBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalRetentionBundleEngine,
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
      throw new Error(`global retention bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global retention bundle ${code} not found`);
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
      throw new Error(`global retention bundle ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newGlobalRetentionBundleService(store: GlobalRetentionBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalRetentionBundleService {
  return new GlobalRetentionBundleService(
    store,
    defaultGlobalRetentionBundleValidator(),
    clockValue,
    [],
    defaultGlobalRetentionBundleEngine(flagsValue),
  );
}
