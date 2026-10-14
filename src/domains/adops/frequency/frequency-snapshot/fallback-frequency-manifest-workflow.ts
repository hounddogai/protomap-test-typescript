import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackFrequencyManifestEngine,
  defaultFallbackFrequencyManifestEngine,
} from "./fallback-frequency-manifest-engine.js";
import {
  FallbackFrequencyManifestValidator,
  defaultFallbackFrequencyManifestValidator,
} from "./fallback-frequency-manifest-rules.js";
import { FallbackFrequencyManifestStore } from "./fallback-frequency-manifest-store.js";

/** Moves fallback frequency manifests through their life cycle and keeps a journal of what it did. */
export class FallbackFrequencyManifestDesk {
  store: FallbackFrequencyManifestStore;
  validator: FallbackFrequencyManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackFrequencyManifestEngine;

  constructor(
    store: FallbackFrequencyManifestStore,
    validator: FallbackFrequencyManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackFrequencyManifestEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback frequency manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback frequency manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback frequency manifest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackFrequencyManifestDesk(store: FallbackFrequencyManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackFrequencyManifestDesk {
  return new FallbackFrequencyManifestDesk(
    store,
    defaultFallbackFrequencyManifestValidator(),
    clockValue,
    [],
    defaultFallbackFrequencyManifestEngine(flagsValue),
  );
}
