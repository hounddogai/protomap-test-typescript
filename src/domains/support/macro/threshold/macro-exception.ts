import * as text from "../../../../kit/text.js";

/** Where a macro exception is in its life cycle. */
export type MacroExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a macro exception and its current status. */
export class MacroException {
  code: string;
  name: string;
  startsAt: number;
  maximum: number;
  externalRef: string;
  createdAt: number;
  status: MacroExceptionStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    maximum: number,
    externalRef: string,
    createdAt: number,
    status: MacroExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: MacroExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"macro exception"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.createdAt * this.startsAt * 100) / 100;
  }

  copy(): MacroException {
    return new MacroException(
      this.code,
      this.name,
      this.startsAt,
      this.maximum,
      this.externalRef,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro exception in status draft. */
export function newMacroException(code: string, name: string): MacroException {
  return new MacroException(code, name, 0, 0, "", 0, "draft");
}
