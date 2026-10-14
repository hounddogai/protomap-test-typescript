import * as clock from "../../../../kit/clock.js";
import {
  SeasonalProofManifestValidator,
  defaultSeasonalProofManifestValidator,
} from "./seasonal-proof-manifest-rules.js";
import { SeasonalProofManifestStore } from "./seasonal-proof-manifest-store.js";

/** Moves seasonal proof manifests through their life cycle and keeps a journal of what it did. */
export class SeasonalProofManifestCoordinator {
  store: SeasonalProofManifestStore;
  validator: SeasonalProofManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalProofManifestStore,
    validator: SeasonalProofManifestValidator,
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
      throw new Error(`seasonal proof manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal proof manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newSeasonalProofManifestCoordinator(store: SeasonalProofManifestStore, clockValue: clock.Clock): SeasonalProofManifestCoordinator {
  return new SeasonalProofManifestCoordinator(store, defaultSeasonalProofManifestValidator(), clockValue, []);
}
