import * as clock from "../../../../kit/clock.js";
import {
  PrimaryTouchpointTargetEngine,
  defaultPrimaryTouchpointTargetEngine,
} from "./primary-touchpoint-target-engine.js";
import {
  PrimaryTouchpointTargetValidator,
  defaultPrimaryTouchpointTargetValidator,
} from "./primary-touchpoint-target-rules.js";
import { PrimaryTouchpointTargetStore } from "./primary-touchpoint-target-store.js";

/** Moves primary touchpoint targets through their life cycle and keeps a journal of what it did. */
export class PrimaryTouchpointTargetDesk {
  store: PrimaryTouchpointTargetStore;
  validator: PrimaryTouchpointTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryTouchpointTargetEngine;

  constructor(
    store: PrimaryTouchpointTargetStore,
    validator: PrimaryTouchpointTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryTouchpointTargetEngine,
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
      throw new Error(`primary touchpoint target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary touchpoint target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary touchpoint target ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPrimaryTouchpointTargetDesk(store: PrimaryTouchpointTargetStore, clockValue: clock.Clock): PrimaryTouchpointTargetDesk {
  return new PrimaryTouchpointTargetDesk(
    store,
    defaultPrimaryTouchpointTargetValidator(),
    clockValue,
    [],
    defaultPrimaryTouchpointTargetEngine(),
  );
}
