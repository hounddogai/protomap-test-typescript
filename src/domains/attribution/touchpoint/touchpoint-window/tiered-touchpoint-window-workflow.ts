import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredTouchpointWindowEngine,
  defaultTieredTouchpointWindowEngine,
} from "./tiered-touchpoint-window-engine.js";
import {
  TieredTouchpointWindowValidator,
  defaultTieredTouchpointWindowValidator,
} from "./tiered-touchpoint-window-rules.js";
import { TieredTouchpointWindowStore } from "./tiered-touchpoint-window-store.js";

/** Moves tiered touchpoint windows through their life cycle and keeps a journal of what it did. */
export class TieredTouchpointWindowManager {
  store: TieredTouchpointWindowStore;
  validator: TieredTouchpointWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTouchpointWindowEngine;

  constructor(
    store: TieredTouchpointWindowStore,
    validator: TieredTouchpointWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTouchpointWindowEngine,
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
      throw new Error(`tiered touchpoint window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered touchpoint window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered touchpoint window ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredTouchpointWindowManager(store: TieredTouchpointWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredTouchpointWindowManager {
  return new TieredTouchpointWindowManager(
    store,
    defaultTieredTouchpointWindowValidator(),
    clockValue,
    [],
    defaultTieredTouchpointWindowEngine(flagsValue),
  );
}
