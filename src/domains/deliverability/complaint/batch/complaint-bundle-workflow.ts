import * as clock from "../../../../kit/clock.js";
import { ComplaintBundleEngine, defaultComplaintBundleEngine } from "./complaint-bundle-engine.js";
import { ComplaintBundleValidator, defaultComplaintBundleValidator } from "./complaint-bundle-rules.js";
import { ComplaintBundleStore } from "./complaint-bundle-store.js";

/** Moves complaint bundles through their life cycle and keeps a journal of what it did. */
export class ComplaintBundleCoordinator {
  store: ComplaintBundleStore;
  validator: ComplaintBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintBundleEngine;

  constructor(
    store: ComplaintBundleStore,
    validator: ComplaintBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintBundleEngine,
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
      throw new Error(`complaint bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newComplaintBundleCoordinator(store: ComplaintBundleStore, clockValue: clock.Clock): ComplaintBundleCoordinator {
  return new ComplaintBundleCoordinator(
    store,
    defaultComplaintBundleValidator(),
    clockValue,
    [],
    defaultComplaintBundleEngine(),
  );
}
