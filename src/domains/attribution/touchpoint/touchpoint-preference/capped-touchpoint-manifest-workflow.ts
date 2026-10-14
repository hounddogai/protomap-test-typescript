import * as clock from "../../../../kit/clock.js";
import {
  CappedTouchpointManifestValidator,
  defaultCappedTouchpointManifestValidator,
} from "./capped-touchpoint-manifest-rules.js";
import { CappedTouchpointManifestStore } from "./capped-touchpoint-manifest-store.js";

/** Moves capped touchpoint manifests through their life cycle and keeps a journal of what it did. */
export class CappedTouchpointManifestCoordinator {
  store: CappedTouchpointManifestStore;
  validator: CappedTouchpointManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedTouchpointManifestStore,
    validator: CappedTouchpointManifestValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped touchpoint manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped touchpoint manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newCappedTouchpointManifestCoordinator(store: CappedTouchpointManifestStore, clockValue: clock.Clock): CappedTouchpointManifestCoordinator {
  return new CappedTouchpointManifestCoordinator(store, defaultCappedTouchpointManifestValidator(), clockValue, []);
}
