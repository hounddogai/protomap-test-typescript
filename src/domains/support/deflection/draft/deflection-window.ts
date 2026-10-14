import * as text from "../../../../kit/text.js";

/** Where a deflection window is in its life cycle. */
export type DeflectionWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A deflection window. Its code is unique within a tenant. */
export class DeflectionWindow {
  code: string;
  name: string;
  budget: number;
  channel: string;
  retries: number;
  minimum: number;
  margin: number;
  status: DeflectionWindowStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    channel: string,
    retries: number,
    minimum: number,
    margin: number,
    status: DeflectionWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.channel = channel;
    this.retries = retries;
    this.minimum = minimum;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection window"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.margin * this.minimum * 100) / 100;
  }

  copy(): DeflectionWindow {
    return new DeflectionWindow(
      this.code,
      this.name,
      this.budget,
      this.channel,
      this.retries,
      this.minimum,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a deflection window in status requested. */
export function newDeflectionWindow(code: string, name: string): DeflectionWindow {
  return new DeflectionWindow(code, name, 0, "", 0, 0, 0, "requested");
}
