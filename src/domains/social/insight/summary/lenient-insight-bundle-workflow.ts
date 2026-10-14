import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientInsightBundleEngine, defaultLenientInsightBundleEngine } from "./lenient-insight-bundle-engine.js";
import {
  LenientInsightBundleValidator,
  defaultLenientInsightBundleValidator,
} from "./lenient-insight-bundle-rules.js";
import { LenientInsightBundleStore } from "./lenient-insight-bundle-store.js";

/** Moves lenient insight bundles through their life cycle and keeps a journal of what it did. */
export class LenientInsightBundleManager {
  store: LenientInsightBundleStore;
  validator: LenientInsightBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientInsightBundleEngine;

  constructor(
    store: LenientInsightBundleStore,
    validator: LenientInsightBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientInsightBundleEngine,
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
      throw new Error(`lenient insight bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient insight bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient insight bundle ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientInsightBundleManager(store: LenientInsightBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientInsightBundleManager {
  return new LenientInsightBundleManager(
    store,
    defaultLenientInsightBundleValidator(),
    clockValue,
    [],
    defaultLenientInsightBundleEngine(flagsValue),
  );
}
