import * as clock from "../../../../kit/clock.js";
import {
  TieredFrequencyManifestValidator,
  defaultTieredFrequencyManifestValidator,
} from "./tiered-frequency-manifest-rules.js";
import { TieredFrequencyManifestStore } from "./tiered-frequency-manifest-store.js";

/** Moves tiered frequency manifests through their life cycle and keeps a journal of what it did. */
export class TieredFrequencyManifestWorkflow {
  store: TieredFrequencyManifestStore;
  validator: TieredFrequencyManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredFrequencyManifestStore,
    validator: TieredFrequencyManifestValidator,
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
      throw new Error(`tiered frequency manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered frequency manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newTieredFrequencyManifestWorkflow(store: TieredFrequencyManifestStore, clockValue: clock.Clock): TieredFrequencyManifestWorkflow {
  return new TieredFrequencyManifestWorkflow(store, defaultTieredFrequencyManifestValidator(), clockValue, []);
}
