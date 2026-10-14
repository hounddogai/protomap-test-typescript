import * as clock from "../../../../kit/clock.js";
import {
  ManualFrequencyManifestValidator,
  defaultManualFrequencyManifestValidator,
} from "./manual-frequency-manifest-rules.js";
import { ManualFrequencyManifestStore } from "./manual-frequency-manifest-store.js";

/** Moves manual frequency manifests through their life cycle and keeps a journal of what it did. */
export class ManualFrequencyManifestService {
  store: ManualFrequencyManifestStore;
  validator: ManualFrequencyManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualFrequencyManifestStore,
    validator: ManualFrequencyManifestValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual frequency manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual frequency manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newManualFrequencyManifestService(store: ManualFrequencyManifestStore, clockValue: clock.Clock): ManualFrequencyManifestService {
  return new ManualFrequencyManifestService(store, defaultManualFrequencyManifestValidator(), clockValue, []);
}
