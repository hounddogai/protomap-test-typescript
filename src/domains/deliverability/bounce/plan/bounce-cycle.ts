import * as text from "../../../../kit/text.js";

/** Where a bounce cycle is in its life cycle. */
export type BounceCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bounce cycle. Its code is unique within a tenant. */
export class BounceCycle {
  code: string;
  label: string;
  externalRef: string;
  updatedAt: number;
  locale: string;
  status: BounceCycleStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    updatedAt: number,
    locale: string,
    status: BounceCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.updatedAt = updatedAt;
    this.locale = locale;
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

  canMoveTo(next: BounceCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): BounceCycle {
    return new BounceCycle(this.code, this.label, this.externalRef, this.updatedAt, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bounce cycle in status idle. */
export function newBounceCycle(code: string, label: string): BounceCycle {
  return new BounceCycle(code, label, "", 0, "", "idle");
}
