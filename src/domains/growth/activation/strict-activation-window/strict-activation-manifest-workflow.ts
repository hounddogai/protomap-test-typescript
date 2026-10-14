import * as clock from "../../../../kit/clock.js";
import {
  StrictActivationManifestValidator,
  defaultStrictActivationManifestValidator,
} from "./strict-activation-manifest-rules.js";
import { StrictActivationManifestStore } from "./strict-activation-manifest-store.js";

/** Moves strict activation manifests through their life cycle and keeps a journal of what it did. */
export class StrictActivationManifestManager {
  store: StrictActivationManifestStore;
  validator: StrictActivationManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictActivationManifestStore,
    validator: StrictActivationManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict activation manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict activation manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newStrictActivationManifestManager(store: StrictActivationManifestStore, clockValue: clock.Clock): StrictActivationManifestManager {
  return new StrictActivationManifestManager(store, defaultStrictActivationManifestValidator(), clockValue, []);
}
