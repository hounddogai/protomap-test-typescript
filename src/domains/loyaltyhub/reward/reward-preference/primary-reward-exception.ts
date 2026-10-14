import * as text from "../../../../kit/text.js";

/** Where a primary reward exception is in its life cycle. */
export type PrimaryRewardExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary reward exception and its current status. */
export class PrimaryRewardException {
  code: string;
  title: string;
  priority: number;
  phone: string;
  audienceId: string;
  journeyId: string;
  description: string;
  status: PrimaryRewardExceptionStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    phone: string,
    audienceId: string,
    journeyId: string,
    description: string,
    status: PrimaryRewardExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.phone = phone;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryRewardExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryRewardExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reward exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary reward exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): PrimaryRewardException {
    return new PrimaryRewardException(
      this.code,
      this.title,
      this.priority,
      this.phone,
      this.audienceId,
      this.journeyId,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary reward exception in status new. */
export function newPrimaryRewardException(code: string, title: string): PrimaryRewardException {
  return new PrimaryRewardException(code, title, 0, "", "", "", "", "new");
}
