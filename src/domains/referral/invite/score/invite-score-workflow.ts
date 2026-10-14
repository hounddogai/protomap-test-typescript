import * as clock from "../../../../kit/clock.js";
import { InviteScoreEngine, defaultInviteScoreEngine } from "./invite-score-engine.js";
import { InviteScoreValidator, defaultInviteScoreValidator } from "./invite-score-rules.js";
import { InviteScoreStore } from "./invite-score-store.js";

/** Moves invite scores through their life cycle and keeps a journal of what it did. */
export class InviteScoreManager {
  store: InviteScoreStore;
  validator: InviteScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteScoreEngine;

  constructor(
    store: InviteScoreStore,
    validator: InviteScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteScoreEngine,
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
      throw new Error(`invite score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite score ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newInviteScoreManager(store: InviteScoreStore, clockValue: clock.Clock): InviteScoreManager {
  return new InviteScoreManager(store, defaultInviteScoreValidator(), clockValue, [], defaultInviteScoreEngine());
}
