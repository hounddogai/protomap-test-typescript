import * as text from "../../../../kit/text.js";

/** Where a capped reward rule batch is in its life cycle. */
export type CappedRewardRuleBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped reward rule batch and its current status. */
export class CappedRewardRuleBatch {
  code: string;
  title: string;
  startsAt: number;
  name: string;
  margin: number;
  checksum: string;
  status: CappedRewardRuleBatchStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    name: string,
    margin: number,
    checksum: string,
    status: CappedRewardRuleBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.name = name;
    this.margin = margin;
    this.checksum = checksum;
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

  canMoveTo(next: CappedRewardRuleBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedRewardRuleBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reward rule batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped reward rule batch"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt - this.margin) * 100) / 100;
  }

  copy(): CappedRewardRuleBatch {
    return new CappedRewardRuleBatch(
      this.code,
      this.title,
      this.startsAt,
      this.name,
      this.margin,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped reward rule batch in status new. */
export function newCappedRewardRuleBatch(code: string, title: string): CappedRewardRuleBatch {
  return new CappedRewardRuleBatch(code, title, 0, "", 0, "", "new");
}
