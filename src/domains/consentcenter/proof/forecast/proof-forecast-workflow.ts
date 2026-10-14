import * as clock from "../../../../kit/clock.js";
import { ProofForecastEngine, defaultProofForecastEngine } from "./proof-forecast-engine.js";
import { ProofForecastValidator, defaultProofForecastValidator } from "./proof-forecast-rules.js";
import { ProofForecastStore } from "./proof-forecast-store.js";

/** Moves proof forecasts through their life cycle and keeps a journal of what it did. */
export class ProofForecastDesk {
  store: ProofForecastStore;
  validator: ProofForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofForecastEngine;

  constructor(
    store: ProofForecastStore,
    validator: ProofForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofForecastEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof forecast ${code} not found`);
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
      throw new Error(`proof forecast ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newProofForecastDesk(store: ProofForecastStore, clockValue: clock.Clock): ProofForecastDesk {
  return new ProofForecastDesk(store, defaultProofForecastValidator(), clockValue, [], defaultProofForecastEngine());
}
