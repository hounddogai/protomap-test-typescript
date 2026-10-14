import * as clock from "../../../../kit/clock.js";
import {
  PendingComplaintBundleEngine,
  defaultPendingComplaintBundleEngine,
} from "./pending-complaint-bundle-engine.js";
import {
  PendingComplaintBundleValidator,
  defaultPendingComplaintBundleValidator,
} from "./pending-complaint-bundle-rules.js";
import { PendingComplaintBundleStore } from "./pending-complaint-bundle-store.js";

/** Moves pending complaint bundles through their life cycle and keeps a journal of what it did. */
export class PendingComplaintBundleService {
  store: PendingComplaintBundleStore;
  validator: PendingComplaintBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingComplaintBundleEngine;

  constructor(
    store: PendingComplaintBundleStore,
    validator: PendingComplaintBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingComplaintBundleEngine,
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
      throw new Error(`pending complaint bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending complaint bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending complaint bundle ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPendingComplaintBundleService(store: PendingComplaintBundleStore, clockValue: clock.Clock): PendingComplaintBundleService {
  return new PendingComplaintBundleService(
    store,
    defaultPendingComplaintBundleValidator(),
    clockValue,
    [],
    defaultPendingComplaintBundleEngine(),
  );
}
