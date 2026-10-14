import * as clock from "../../../../kit/clock.js";
import { PlacementAgreementEngine, defaultPlacementAgreementEngine } from "./placement-agreement-engine.js";
import { PlacementAgreementValidator, defaultPlacementAgreementValidator } from "./placement-agreement-rules.js";
import { PlacementAgreementStore } from "./placement-agreement-store.js";

/** Moves placement agreements through their life cycle and keeps a journal of what it did. */
export class PlacementAgreementService {
  store: PlacementAgreementStore;
  validator: PlacementAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementAgreementEngine;

  constructor(
    store: PlacementAgreementStore,
    validator: PlacementAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementAgreementEngine,
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
      throw new Error(`placement agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement agreement ${code} not found`);
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

export function newPlacementAgreementService(store: PlacementAgreementStore, clockValue: clock.Clock): PlacementAgreementService {
  return new PlacementAgreementService(
    store,
    defaultPlacementAgreementValidator(),
    clockValue,
    [],
    defaultPlacementAgreementEngine(),
  );
}
