import * as text from "../../../../kit/text.js";

/** Where a global tier digest is in its life cycle. */
export type GlobalTierDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global tier digest. Its code is unique within a tenant. */
export class GlobalTierDigest {
  code: string;
  label: string;
  summary: string;
  approved: boolean;
  title: string;
  score: number;
  status: GlobalTierDigestStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    approved: boolean,
    title: string,
    score: number,
    status: GlobalTierDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.approved = approved;
    this.title = title;
    this.score = score;
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

  canMoveTo(next: GlobalTierDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalTierDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global tier digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): GlobalTierDigest {
    return new GlobalTierDigest(
      this.code,
      this.label,
      this.summary,
      this.approved,
      this.title,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global tier digest in status idle. */
export function newGlobalTierDigest(code: string, label: string): GlobalTierDigest {
  return new GlobalTierDigest(code, label, "", false, "", 0, "idle");
}
