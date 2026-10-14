import * as clock from "../../../../kit/clock.js";
import {
  WeightedInviteManifestEngine,
  defaultWeightedInviteManifestEngine,
} from "./weighted-invite-manifest-engine.js";
import {
  WeightedInviteManifestValidator,
  defaultWeightedInviteManifestValidator,
} from "./weighted-invite-manifest-rules.js";
import { WeightedInviteManifestStore } from "./weighted-invite-manifest-store.js";

/** Moves weighted invite manifests through their life cycle and keeps a journal of what it did. */
export class WeightedInviteManifestService {
  store: WeightedInviteManifestStore;
  validator: WeightedInviteManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedInviteManifestEngine;

  constructor(
    store: WeightedInviteManifestStore,
    validator: WeightedInviteManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedInviteManifestEngine,
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
      throw new Error(`weighted invite manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted invite manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted invite manifest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newWeightedInviteManifestService(store: WeightedInviteManifestStore, clockValue: clock.Clock): WeightedInviteManifestService {
  return new WeightedInviteManifestService(
    store,
    defaultWeightedInviteManifestValidator(),
    clockValue,
    [],
    defaultWeightedInviteManifestEngine(),
  );
}
