import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveFrequencyDigestEngine,
  defaultAdaptiveFrequencyDigestEngine,
} from "./adaptive-frequency-digest-engine.js";
import {
  AdaptiveFrequencyDigestValidator,
  defaultAdaptiveFrequencyDigestValidator,
} from "./adaptive-frequency-digest-rules.js";
import { AdaptiveFrequencyDigestStore } from "./adaptive-frequency-digest-store.js";

/** Moves adaptive frequency digests through their life cycle and keeps a journal of what it did. */
export class AdaptiveFrequencyDigestCoordinator {
  store: AdaptiveFrequencyDigestStore;
  validator: AdaptiveFrequencyDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveFrequencyDigestEngine;

  constructor(
    store: AdaptiveFrequencyDigestStore,
    validator: AdaptiveFrequencyDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveFrequencyDigestEngine,
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
      throw new Error(`adaptive frequency digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive frequency digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive frequency digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newAdaptiveFrequencyDigestCoordinator(store: AdaptiveFrequencyDigestStore, clockValue: clock.Clock): AdaptiveFrequencyDigestCoordinator {
  return new AdaptiveFrequencyDigestCoordinator(
    store,
    defaultAdaptiveFrequencyDigestValidator(),
    clockValue,
    [],
    defaultAdaptiveFrequencyDigestEngine(),
  );
}
