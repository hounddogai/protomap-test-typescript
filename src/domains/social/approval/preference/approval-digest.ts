import * as text from "../../../../kit/text.js";

/** Where a approval digest is in its life cycle. */
export type ApprovalDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One approval digest, with what the planners need to act on it. */
export class ApprovalDigest {
  code: string;
  name: string;
  attributes: Map<string, string>;
  limit: number;
  version: number;
  status: ApprovalDigestStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    limit: number,
    version: number,
    status: ApprovalDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.limit = limit;
    this.version = version;
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

  canMoveTo(next: ApprovalDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"approval digest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.version - this.limit) * 100) / 100;
  }

  copy(): ApprovalDigest {
    return new ApprovalDigest(this.code, this.name, this.attributes, this.limit, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval digest in status idle. */
export function newApprovalDigest(code: string, name: string): ApprovalDigest {
  return new ApprovalDigest(code, name, new Map<string, string>(), 0, 0, "idle");
}
