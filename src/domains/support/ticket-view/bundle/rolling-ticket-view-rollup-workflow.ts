import * as clock from "../../../../kit/clock.js";
import {
  RollingTicketViewRollupEngine,
  defaultRollingTicketViewRollupEngine,
} from "./rolling-ticket-view-rollup-engine.js";
import {
  RollingTicketViewRollupValidator,
  defaultRollingTicketViewRollupValidator,
} from "./rolling-ticket-view-rollup-rules.js";
import { RollingTicketViewRollupStore } from "./rolling-ticket-view-rollup-store.js";

/** Moves rolling ticket view rollups through their life cycle and keeps a journal of what it did. */
export class RollingTicketViewRollupCoordinator {
  store: RollingTicketViewRollupStore;
  validator: RollingTicketViewRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingTicketViewRollupEngine;

  constructor(
    store: RollingTicketViewRollupStore,
    validator: RollingTicketViewRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingTicketViewRollupEngine,
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
      throw new Error(`rolling ticket view rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling ticket view rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling ticket view rollup ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingTicketViewRollupCoordinator(store: RollingTicketViewRollupStore, clockValue: clock.Clock): RollingTicketViewRollupCoordinator {
  return new RollingTicketViewRollupCoordinator(
    store,
    defaultRollingTicketViewRollupValidator(),
    clockValue,
    [],
    defaultRollingTicketViewRollupEngine(),
  );
}
