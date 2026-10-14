import * as clock from "../../../../kit/clock.js";
import { LenientFlightManifestEngine, defaultLenientFlightManifestEngine } from "./lenient-flight-manifest-engine.js";
import {
  LenientFlightManifestValidator,
  defaultLenientFlightManifestValidator,
} from "./lenient-flight-manifest-rules.js";
import { LenientFlightManifestStore } from "./lenient-flight-manifest-store.js";

/** Moves lenient flight manifests through their life cycle and keeps a journal of what it did. */
export class LenientFlightManifestDesk {
  store: LenientFlightManifestStore;
  validator: LenientFlightManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientFlightManifestEngine;

  constructor(
    store: LenientFlightManifestStore,
    validator: LenientFlightManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientFlightManifestEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient flight manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient flight manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient flight manifest ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientFlightManifestDesk(store: LenientFlightManifestStore, clockValue: clock.Clock): LenientFlightManifestDesk {
  return new LenientFlightManifestDesk(
    store,
    defaultLenientFlightManifestValidator(),
    clockValue,
    [],
    defaultLenientFlightManifestEngine(),
  );
}
