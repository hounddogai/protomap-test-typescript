import * as clock from "../../../../kit/clock.js";
import {
  LegacyFraudCheckEstimateEngine,
  defaultLegacyFraudCheckEstimateEngine,
} from "./legacy-fraud-check-estimate-engine.js";
import {
  LegacyFraudCheckEstimateValidator,
  defaultLegacyFraudCheckEstimateValidator,
} from "./legacy-fraud-check-estimate-rules.js";
import { LegacyFraudCheckEstimateStore } from "./legacy-fraud-check-estimate-store.js";

/** Moves legacy fraud check estimates through their life cycle and keeps a journal of what it did. */
export class LegacyFraudCheckEstimateService {
  store: LegacyFraudCheckEstimateStore;
  validator: LegacyFraudCheckEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyFraudCheckEstimateEngine;

  constructor(
    store: LegacyFraudCheckEstimateStore,
    validator: LegacyFraudCheckEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyFraudCheckEstimateEngine,
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
      throw new Error(`legacy fraud check estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy fraud check estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy fraud check estimate ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLegacyFraudCheckEstimateService(store: LegacyFraudCheckEstimateStore, clockValue: clock.Clock): LegacyFraudCheckEstimateService {
  return new LegacyFraudCheckEstimateService(
    store,
    defaultLegacyFraudCheckEstimateValidator(),
    clockValue,
    [],
    defaultLegacyFraudCheckEstimateEngine(),
  );
}
