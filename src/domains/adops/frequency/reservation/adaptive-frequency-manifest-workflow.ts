import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveFrequencyManifestEngine,
  defaultAdaptiveFrequencyManifestEngine,
} from "./adaptive-frequency-manifest-engine.js";
import {
  AdaptiveFrequencyManifestValidator,
  defaultAdaptiveFrequencyManifestValidator,
} from "./adaptive-frequency-manifest-rules.js";
import { AdaptiveFrequencyManifestStore } from "./adaptive-frequency-manifest-store.js";

/** Moves adaptive frequency manifests through their life cycle and keeps a journal of what it did. */
export class AdaptiveFrequencyManifestService {
  store: AdaptiveFrequencyManifestStore;
  validator: AdaptiveFrequencyManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveFrequencyManifestEngine;

  constructor(
    store: AdaptiveFrequencyManifestStore,
    validator: AdaptiveFrequencyManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveFrequencyManifestEngine,
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
      throw new Error(`adaptive frequency manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive frequency manifest ${code} not found`);
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
      throw new Error(`adaptive frequency manifest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveFrequencyManifestService(store: AdaptiveFrequencyManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveFrequencyManifestService {
  return new AdaptiveFrequencyManifestService(
    store,
    defaultAdaptiveFrequencyManifestValidator(),
    clockValue,
    [],
    defaultAdaptiveFrequencyManifestEngine(flagsValue),
  );
}
