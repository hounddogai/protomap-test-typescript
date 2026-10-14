import * as clock from "../../../../kit/clock.js";
import {
  LenientModelManifestValidator,
  defaultLenientModelManifestValidator,
} from "./lenient-model-manifest-rules.js";
import { LenientModelManifestStore } from "./lenient-model-manifest-store.js";

/** Moves lenient model manifests through their life cycle and keeps a journal of what it did. */
export class LenientModelManifestManager {
  store: LenientModelManifestStore;
  validator: LenientModelManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientModelManifestStore,
    validator: LenientModelManifestValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient model manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient model manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newLenientModelManifestManager(store: LenientModelManifestStore, clockValue: clock.Clock): LenientModelManifestManager {
  return new LenientModelManifestManager(store, defaultLenientModelManifestValidator(), clockValue, []);
}
