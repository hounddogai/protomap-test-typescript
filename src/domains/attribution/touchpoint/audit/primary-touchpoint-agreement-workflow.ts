import * as clock from "../../../../kit/clock.js";
import {
  PrimaryTouchpointAgreementEngine,
  defaultPrimaryTouchpointAgreementEngine,
} from "./primary-touchpoint-agreement-engine.js";
import {
  PrimaryTouchpointAgreementValidator,
  defaultPrimaryTouchpointAgreementValidator,
} from "./primary-touchpoint-agreement-rules.js";
import { PrimaryTouchpointAgreementStore } from "./primary-touchpoint-agreement-store.js";

/** Moves primary touchpoint agreements through their life cycle and keeps a journal of what it did. */
export class PrimaryTouchpointAgreementCoordinator {
  store: PrimaryTouchpointAgreementStore;
  validator: PrimaryTouchpointAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryTouchpointAgreementEngine;

  constructor(
    store: PrimaryTouchpointAgreementStore,
    validator: PrimaryTouchpointAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryTouchpointAgreementEngine,
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
      throw new Error(`primary touchpoint agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary touchpoint agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary touchpoint agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPrimaryTouchpointAgreementCoordinator(store: PrimaryTouchpointAgreementStore, clockValue: clock.Clock): PrimaryTouchpointAgreementCoordinator {
  return new PrimaryTouchpointAgreementCoordinator(
    store,
    defaultPrimaryTouchpointAgreementValidator(),
    clockValue,
    [],
    defaultPrimaryTouchpointAgreementEngine(),
  );
}
