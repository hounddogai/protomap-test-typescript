import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveComplaintBundleEngine,
  defaultAdaptiveComplaintBundleEngine,
} from "./adaptive-complaint-bundle-engine.js";
import {
  AdaptiveComplaintBundleValidator,
  defaultAdaptiveComplaintBundleValidator,
} from "./adaptive-complaint-bundle-rules.js";
import { AdaptiveComplaintBundleStore } from "./adaptive-complaint-bundle-store.js";

/** Moves adaptive complaint bundles through their life cycle and keeps a journal of what it did. */
export class AdaptiveComplaintBundleManager {
  store: AdaptiveComplaintBundleStore;
  validator: AdaptiveComplaintBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveComplaintBundleEngine;

  constructor(
    store: AdaptiveComplaintBundleStore,
    validator: AdaptiveComplaintBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveComplaintBundleEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive complaint bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive complaint bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive complaint bundle ${code} not found`);
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

export function newAdaptiveComplaintBundleManager(store: AdaptiveComplaintBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveComplaintBundleManager {
  return new AdaptiveComplaintBundleManager(
    store,
    defaultAdaptiveComplaintBundleValidator(),
    clockValue,
    [],
    defaultAdaptiveComplaintBundleEngine(flagsValue),
  );
}
