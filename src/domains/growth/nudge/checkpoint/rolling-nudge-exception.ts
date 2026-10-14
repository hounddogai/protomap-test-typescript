import * as text from "../../../../kit/text.js";

/** Where a rolling nudge exception is in its life cycle. */
export type RollingNudgeExceptionStatus = "created" | "validated" | "published" | "retired";

/** A rolling nudge exception. Its code is unique within a tenant. */
export class RollingNudgeException {
  code: string;
  title: string;
  visible: boolean;
  locale: string;
  budget: number;
  status: RollingNudgeExceptionStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    locale: string,
    budget: number,
    status: RollingNudgeExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.locale = locale;
    this.budget = budget;
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

  canMoveTo(next: RollingNudgeExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingNudgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling nudge exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): RollingNudgeException {
    return new RollingNudgeException(this.code, this.title, this.visible, this.locale, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling nudge exception in status created. */
export function newRollingNudgeException(code: string, title: string): RollingNudgeException {
  return new RollingNudgeException(code, title, false, "", 0, "created");
}
