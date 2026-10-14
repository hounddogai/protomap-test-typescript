import * as text from "../../../../kit/text.js";

/** Where a creative budget is in its life cycle. */
export type CreativeBudgetStatus = "created" | "validated" | "published" | "retired";

/** The record of a creative budget and its current status. */
export class CreativeBudget {
  code: string;
  name: string;
  windowDays: number;
  checksum: string;
  budget: number;
  createdAt: number;
  pinned: boolean;
  status: CreativeBudgetStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    checksum: string,
    budget: number,
    createdAt: number,
    pinned: boolean,
    status: CreativeBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.budget = budget;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CreativeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round(this.budget * this.windowDays * 100) / 100;
  }

  copy(): CreativeBudget {
    return new CreativeBudget(
      this.code,
      this.name,
      this.windowDays,
      this.checksum,
      this.budget,
      this.createdAt,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative budget in status created. */
export function newCreativeBudget(code: string, name: string): CreativeBudget {
  return new CreativeBudget(code, name, 0, "", 0, 0, false, "created");
}
