import * as text from "../../../../kit/text.js";

/** Where a deflection profile is in its life cycle. */
export type DeflectionProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A deflection profile. Its code is unique within a tenant. */
export class DeflectionProfile {
  code: string;
  name: string;
  score: number;
  openRate: number;
  approved: boolean;
  notes: string;
  limit: number;
  status: DeflectionProfileStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    openRate: number,
    approved: boolean,
    notes: string,
    limit: number,
    status: DeflectionProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.openRate = openRate;
    this.approved = approved;
    this.notes = notes;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.limit + this.score) * 100) / 100;
  }

  copy(): DeflectionProfile {
    return new DeflectionProfile(
      this.code,
      this.name,
      this.score,
      this.openRate,
      this.approved,
      this.notes,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a deflection profile in status idle. */
export function newDeflectionProfile(code: string, name: string): DeflectionProfile {
  return new DeflectionProfile(code, name, 0, 0, false, "", 0, "idle");
}
